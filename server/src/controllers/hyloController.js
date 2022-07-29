import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

import _, { get } from 'lodash';
import boom from '@hapi/boom';

import { gqlRequest } from '../services/hylo/utils';
import { gql } from 'graphql-request';
import { addMember, createHyloGroup, upsertHyloUser } from '../services/hylo.service';
import rolesService from '../services/roles.service';

const validateOrThrow = (schema, _value) => {
  const { value, error } = schema.validate(_value);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }
  return value;
};

export const GROUP_FIELDS = gql`
  fragment GroupFields on Group {
    id
    name
    slug
    # invitePath
    type
    avatarUrl
    bannerUrl
    location
    members {
      items {
        id
        name
        avatarUrl
        bannerUrl
        hasRegistered
        tagline
        url
        contactEmail
      }
    }
  }
`;

export const QUERY_GROUP = gql`
  ${GROUP_FIELDS}
  query Group($id: ID!) {
    group(id: $id) {
      ...GroupFields
    }
  }
`;

const loadHyloGroup = async (id) => {
  const data = await gqlRequest(QUERY_GROUP, { id });
  return data?.group;
};

export const getIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string()
      .required()
      .messages({ 'any.required': 'The groupId query parameter is required' }),
  });

  const { groupId } = validateOrThrow(schema, req.params);

  // Find integrated Hylo group
  const mapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: new ObjectId(groupId) });
  if (!mapping) {
    return res.json(null);
  }

  // Find SurveyStack memberships
  const ssMemberships = await db
    .collection('memberships')
    .aggregate([
      {
        $match: { group: new ObjectId(groupId) },
      },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, 'user.email': 1, 'user._id': 1 } },
    ])
    .toArray();

  // Find Hylo members on by email
  const queryHyloMembers = gql`
    query SurveyStackMembers {
      ${ssMemberships
        .map(
          ({ user }, i) => `member${i}: person(email:"${user?.email}") {
            id
            hasRegistered
          }`
        )
        .join('\n')}
    }
  `;
  const hyloMemberMap = await gqlRequest(queryHyloMembers);

  // Find the Hylo group
  const hyloGroup = await loadHyloGroup(mapping.hyloGroupId);

  // Add the SurveyStack user IDs to the Hylo member objects
  ssMemberships.forEach((ssMembership, i) => {
    const hyloMember = hyloMemberMap[`member${i}`];
    // Only add the user if they are also a member of the Hylo group
    let hyloMemberInGroup =
      hyloMember && (hyloGroup?.members?.items || []).find((m) => m.id === hyloMember.id);

    // TODO Hylo currently don't show membership status until the user finished registration
    //   for now, add the user even if it not listed in the Hylo group members
    if (!hyloMemberInGroup && hyloMember && !hyloMember.hasRegistered) {
      (hyloGroup?.members?.items || []).push(hyloMember);
      hyloMemberInGroup = hyloMember;
    }

    if (hyloMemberInGroup) {
      hyloMemberInGroup.surveyStackMembership = ssMembership;
      hyloMemberInGroup.hyloUrl = `${process.env.HYLO_API_URL}/groups/${hyloGroup?.slug}/members/${hyloMember.id}`;
    }
  });
  res.json(hyloGroup);
};

export const createNewIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${groupId}`);
  }

  const user = res.locals.auth.user;
  const hyloUser = await upsertHyloUser({ name: user.name, email: user.email });
  const { group: hyloGroup } = await createHyloGroup({
    data: {
      accessibility: 1,
      name: group.name,
      slug: group.slug,
      parentIds: [],
      visibility: 2,
    },
    hyloUserId: hyloUser.id,
  });

  await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .updateOne(
      { groupId: new ObjectId(groupId) },
      { $set: { hyloGroupId: hyloGroup.id } },
      { upsert: true }
    );
  const detailedHyloGroup = await loadHyloGroup(hyloGroup.id);
  res.json(detailedHyloGroup);
};

export const inviteMemberToHyloGroup = async (req, res) => {
  const schema = Joi.object({
    membershipId: Joi.string().required(),
  });

  const { membershipId } = validateOrThrow(schema, req.body);
  // Find membership
  const membership = await db
    .collection('memberships')
    .findOne({ _id: new ObjectId(membershipId) });
  if (!membership) {
    throw boom.notFound(`Can't find membership with the ID "${membershipId}"`);
  }

  // Authorize request
  const adminId = get(res, 'locals.auth.user._id');
  const hasAdminRole = await rolesService.hasAdminRole(adminId, membership.group);
  if (!hasAdminRole) {
    throw boom.unauthorized();
  }

  // Find the user
  const user = membership.user && (await db.collection('users').findOne({ _id: membership.user }));
  // Throw if user is missing (or the membership is pending)
  if (!user) {
    throw boom.notFound(`Membership "${membershipId}" has no user`);
  }

  // Find Hylo integration
  const mapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: membership.group });
  if (!mapping) {
    throw boom.notFound(`Can't find Hylo integration for group "${membership.group}"`);
  }

  // Upsert the users and add it to the hylo group
  const hyloUser = await upsertHyloUser({ name: user.name, email: user.email });

  await addMember({ hyloUserId: hyloUser.id, hyloGroupId: mapping.hyloGroupId });
  res.json({ ok: true });
};

export const setIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    hyloGroupId: Joi.string().required(),
    groupId: Joi.string().required(),
  });

  const { hyloGroupId, groupId } = validateOrThrow(schema, req.body);

  const hyloGroup = await loadHyloGroup(hyloGroupId);
  if (!hyloGroup) {
    throw boom.notFound(`Can't find Hylo group with the ID "${hyloGroupId}`);
  }

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${groupId}"`);
  }

  await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .updateOne({ groupId: ObjectId(groupId) }, { $set: { hyloGroupId } }, { upsert: true });

  res.json(hyloGroup);
};
export const removeHyloGroupIntegration = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: new ObjectId(groupId) });

  res.send({ ok: true });
};

export const QUERY_GROUP_BY_SLUG = gql`
  ${GROUP_FIELDS}
  query GroupBySlug($slug: String!) {
    group(slug: $slug) {
      ...GroupFields
    }
  }
`;

export const getGroupBySlug = async (req, res) => {
  const schema = Joi.object({
    slug: Joi.string().required(),
  });
  const { slug } = validateOrThrow(schema, req.query);
  const data = await gqlRequest(QUERY_GROUP_BY_SLUG, { slug });
  res.json(data?.group);
};
