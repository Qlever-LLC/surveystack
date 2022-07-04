import boom from '@hapi/boom';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import querystring from 'querystring';
import jsonSafeStringify from 'json-stringify-safe';

import * as utils from '../helpers/surveys';

import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { gql } from 'graphql-request';
import * as hyloUtils from './hylo/utils';
import Joi from 'joi';
import { isString, pick, find } from 'lodash';

export const API_COMPOSE_TYPE_HYLO = 'hylo';
export const HYLO_TYPE_SYNC_GROUP = 'sync-group';

const createLogger = () => {
  const logs = [];
  const log = (type, message, data) => {
    if (!message || !isString(message)) {
      throw `Message has to be a string`;
    }
    logs.push({ type, message, data, time: Date.now() });
  };
  return {
    log,
    success: (message, data) => log('success', message, data),
    error: (message, data) => {
      return new Error(message + jsonSafeStringify(data, null, 2));
    },
    warning: (message, data) => log('warning', message, data),
    info: (message, data) => log('info', message, data),
    getLogs: () => [...logs],
  };
};

const deps = {
  gqlRequest: hyloUtils.gqlRequest,
  gqlRequestWithUrl: hyloUtils.gqlRequestWithUrl,
  postHyloUser: hyloUtils.postHyloUser,
  logger: createLogger(),
};

const outputSchema = Joi.object({
  entity: Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    type: Joi.string().valid('farm').required(),
    extraModerators: Joi.array()
      .min(0)
      .items(
        Joi.object({
          name: Joi.object({ value: Joi.string().required() }).required(),
          email: Joi.object({ value: Joi.string().required() }).required(),
        }).optional()
      ),
  }).required(),
})
  .required()
  .options({ allowUnknown: true });

export const FRAGMENT_PERSON_DETAILS = gql`
  fragment PersonDetails on Person {
    id
    name
    email: contactEmail
    hasRegistered
  }
`;

export const FRAGMENT_GROUP_DETAILS = gql`
  fragment GroupDetails on Group {
    id
    name
    slug
    members {
      items {
        ...PersonDetails
      }
    }
  }
  ${FRAGMENT_PERSON_DETAILS}
`;

export const QUERY_PERSON_BY_EMAIL = gql`
  query ($email: String) {
    person(email: $email) {
      ...PersonDetails
    }
  }
  ${FRAGMENT_PERSON_DETAILS}
`;

export const MUTATION_CREATE_GROUP = gql`
  mutation ($data: GroupInput, $asUserId: ID) {
    group: createGroup(data: $data, asUserId: $asUserId) {
      ...GroupDetails
    }
  }
  ${FRAGMENT_GROUP_DETAILS}
`;

export const MUTATION_UPDATE_GROUP = gql`
  mutation ($id: ID, $changes: GroupInput, $asUserId: ID) {
    group: updateGroup(id: $id, changes: $changes, asUserId: $asUserId) {
      ...GroupDetails
    }
  }
  ${FRAGMENT_GROUP_DETAILS}
`;

export const MUTATION_ADD_MEMBER = gql`
  mutation ($hyloUserId: ID, $hyloGroupId: ID) {
    member: addMember(userId: $hyloUserId, groupId: $hyloGroupId, role: 1) {
      success
      error
    }
  }
`;

const createHyloUser = async (options) => {
  const { email, name, hyloGroupId, postHyloUser, logger } = { ...deps, ...options };
  logger.info(`create Hylo user email=${email} name=${name} hyloGroupId=${hyloGroupId}...`, {
    email,
    name,
    hyloGroupId,
  });
  try {
    const r = await postHyloUser(
      querystring.stringify({ email, name, groupId: hyloGroupId, isModerator: true })
    );
    logger.info('create user result:', r.data);
    return r.data;
  } catch (e) {
    logger.error(`Failed to create user: "${e.response?.data?.error}"`, e);
    throw e;
  }
};

export const queryHyloUser = async (options) => {
  const { email, gqlRequest, logger } = { ...deps, ...options };
  logger.info(`Query Hylo user - email="${email}"`);
  const result = (await gqlRequest(QUERY_PERSON_BY_EMAIL, { email })).person;
  logger.info('Query Hylo user result:', { person: result });
  return result;
};

export const createHyloGroup = async (options) => {
  const { data, hyloUserId, gqlRequest, logger } = { ...deps, ...options };

  const randomPostfix = () => {
    var minm = 100000;
    var maxm = 999999;
    return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
  };

  const maxTrials = 12;

  for (let trial = 0; trial <= maxTrials; trial++) {
    const dataWithSlug = {
      ...data,
      slug: trial === 0 ? data.slug : `${data.slug}-${randomPostfix()}`,
    };
    try {
      logger.info(`Create Hylo group slug=${dataWithSlug.slug} hyloUserId=${hyloUserId}`, {
        data: dataWithSlug,
        hyloUserId,
      });
      const result = await gqlRequest(MUTATION_CREATE_GROUP, {
        data: dataWithSlug,
        asUserId: hyloUserId,
      });
      logger.info('Create Hylo group result:', result);
      return result;
    } catch (e) {
      if (hasGqlError(e, 'A group with that URL slug already exists')) {
        logger.info(
          `Group with slug ${dataWithSlug.slug} already exist. Trying andother postfix...`,
          e.response?.errors
        );
      } else {
        throw logger.error('Failed to create group', e.response?.errors || { error: String(e) });
      }
    }
  }

  throw logger.error(`Failed to find a free slug after ${maxTrials} trials`);
};

export const updateHyloGroup = async (options) => {
  const { data, hyloUserId, hyloGroupId, gqlRequest, logger } = { ...deps, ...options };
  logger.info(`Update hylo group  ID=${hyloGroupId}`, { data, hyloUserId, hyloGroupId });
  const result = await gqlRequest(MUTATION_UPDATE_GROUP, {
    id: hyloGroupId,
    changes: data,
    asUserId: hyloUserId,
  });
  logger.info('Update Hylo group result:', result);
  return result;
};

export const addMember = async (options) => {
  const { hyloUserId, hyloGroupId, gqlRequest, logger } = { ...deps, ...options };
  logger.info(`Add member (${hyloUserId}) to group (${hyloGroupId})...`);
  const result = await gqlRequest(MUTATION_ADD_MEMBER, {
    hyloGroupId,
    hyloUserId,
  });
  logger.log(result.member?.success ? 'success' : 'error', 'Add member results:', {
    hyloUserId,
    hyloGroupId,
    result,
  });
};

export const upsertHyloUser = async (options) => {
  const {
    email,
    name,
    hyloGroupId,
    createHyloUser: _createHyloUser,
    addMember: _addMember,
    queryHyloUser: _queryHyloUser,
    logger,
  } = { ...deps, createHyloUser, addMember, queryHyloUser, ...options };

  logger.info('Upsert Hylo user', { email, name, hyloGroupId });
  let hyloUser = await _queryHyloUser({ email, ...options });

  // if user does not exists
  if (!hyloUser?.id) {
    hyloUser = await _createHyloUser({
      email,
      name,
      hyloGroupId,
      ...options,
    });
  } else if (hyloGroupId) {
    logger.info('Add existing member to group...');
    await _addMember({ hyloUserId: hyloUser.id, hyloGroupId, ...options });
  }

  if (!hyloUser?.id) {
    throw logger.error("Hylo didn't return an ID for the user", { hyloUser });
  }

  logger.success('Got Hylo user', hyloUser);
  return hyloUser;
};

export const syncUserWithHylo = async (options) => {
  const {
    userId,
    upsertHyloUser: _upsertHyloUser,
    logger,
  } = { ...deps, upsertHyloUser, ...options };
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw logger.error(`Can't find SurveyStack user with id "${userId}"`);
  }
  return await _upsertHyloUser({ email: user.email, name: user.name, ...options });
};

const hasGqlError = (e, message) => (e.response?.errors || []).some((e) => e.message === message);

export const syncGroupWithHylo = async (options) => {
  const {
    data,
    hyloGroupId,
    hyloUserId,
    updateHyloGroup: _updateHyloGroup,
    createHyloGroup: _createHyloGroup,
    logger,
  } = { ...deps, updateHyloGroup, createHyloGroup, ...options };
  let group;
  if (hyloGroupId) {
    logger.info(`Update the Hylo group with ID "${hyloGroupId}"`);
    group = (await _updateHyloGroup({ data, hyloUserId, hyloGroupId, ...options })).group;
  } else {
    logger.info(`Create a new Hylo group with slug "${data.slug}-#"`);
    group = (await _createHyloGroup({ data, hyloUserId, ...options })).group;
  }

  logger.info('Got Hylo group', group);
  return group;
};

export const getHyloApiComposeOutputs = ({ submission, survey }) => {
  const surveyVersion = submission.meta.survey.version;

  const { controls } = survey.revisions.find((revision) => revision.version === surveyVersion);
  const positions = utils.getControlPositions(controls);
  return positions
    .map((position) => {
      const control = utils.getControl(controls, position);
      if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
        return [];
      }

      const field = utils.getSubmissionField(submission, survey, position);

      const compose = [];

      if (field.meta.relevant === false) {
        return [];
      }

      if (!field.meta.apiCompose) {
        return [];
      }

      if (Array.isArray(field.meta.apiCompose)) {
        for (const c of field.meta.apiCompose) {
          compose.push(c);
        }
      } else if (typeof field.meta.apiCompose === 'object') {
        compose.push(field.meta.apiCompose);
      } else {
        return [];
      }

      const relevantApiCompose = compose.filter((c) => c.type === API_COMPOSE_TYPE_HYLO);
      if (relevantApiCompose.length === 0) {
        return [];
      }

      return compose;
    })
    .flat();
};

export const handleSyncGroupOutput = async (options) => {
  const {
    output: _output,
    user,
    group,
    logger,
    hyloGroupId,
    syncUserWithHylo: _syncUserWithHylo,
    syncGroupWithHylo: _syncGroupWithHylo,
    addMember: _addMember,
    upsertHyloUser: _upsertHyloUser,
    gqlRequest: _gqlRequest,
    gqlRequestWithUrl: _gqlRequestWithUrl,
    postHyloUser: _postHyloUser,
  } = { ...deps, syncUserWithHylo, syncGroupWithHylo, addMember, upsertHyloUser, ...options };
  const { value: output, error } = outputSchema.validate(_output);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(', ')}`);
  }
  logger.success('Output is valid', output);

  const {
    url,
    entity: { extraModerators, ...entity },
  } = output;

  function addHttps(url) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }
  const apiUrl = url ? addHttps(url) : process.env.HYLO_API_URL;
  logger.info(`Hylo API URL: "${apiUrl}"`, {
    urlFromApiCompose: String(url),
    defaultHyloApiUrl: process.env.HYLO_API_URL,
  });
  const gqlRequest = _gqlRequestWithUrl(apiUrl);
  const postHyloUser = (body) => _postHyloUser(body, apiUrl);
  const baseDeps = { gqlRequest, postHyloUser, logger };

  // Convert some fields to JSON to match the Hylo API
  entity.geoShape = jsonSafeStringify(entity.geoShape);
  entity.groupExtensions = entity.groupExtensions.map((e) => ({
    ...e,
    data: jsonSafeStringify(e.data),
  }));
  // TODO Hylo throws Invalid GeoJSON
  delete entity.geoShape;
  logger.warning('Remove data.geoShape - TODO Hylo throws "Invalid GeoJSON"');

  const groupMapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: new ObjectId(group.id) });
  if (groupMapping) {
    entity.parentIds = [groupMapping.hyloGroupId];
    logger.success('Found Hylo group integration', groupMapping);
  } else {
    logger.warning("Didn't find Hylo group integration", groupMapping);
  }
  const hyloUser = await _syncUserWithHylo({ userId: user._id, ...baseDeps });
  const hyloGroup = await _syncGroupWithHylo({
    data: entity,
    hyloUserId: hyloUser.id,
    hyloGroupId,
    ...baseDeps,
  });
  logger.info('Add current user to the group (to be sure they are added)...');
  await _addMember({ hyloGroupId: hyloGroup.id, hyloUserId: hyloUser.id, ...baseDeps });

  const extraModeratorUsers = [];
  for (const { email, name } of extraModerators) {
    logger.info(`Add extra moderator email=${email?.value} name=${name?.value}`);
    extraModeratorUsers.push(
      await _upsertHyloUser({
        email: email.value,
        name: name.value,
        hyloGroupId: hyloGroup.id,
        ...baseDeps,
      })
    );
  }

  logger.info('extraModeratorUsers', extraModeratorUsers);

  const permanent = {
    type: API_COMPOSE_TYPE_HYLO,
    hyloType: HYLO_TYPE_SYNC_GROUP,
    // TODO we probably won't need email and name
    createdHyloGroup: pick(hyloGroup, 'id', 'slug', 'name'),
    submittingHyloUser: pick(hyloUser, 'id', 'email', 'name'),
    extraModeratorUsers: extraModeratorUsers.map((u) => pick(u, 'id', 'email', 'name')),
  };

  return { hyloUser, hyloGroup, extraModeratorUsers, permanent };
};

export const handle = async (options) => {
  const {
    submission,
    prevSubmission,
    survey,
    user,
    getHyloApiComposeOutputs: _getHyloApiComposeOutputs,
    handleSyncGroupOutput: _handleSyncGroupOutput,
  } = { getHyloApiComposeOutputs, handleSyncGroupOutput, ...options };
  const outputs = _getHyloApiComposeOutputs({ submission, survey });
  const results = [];
  const logger = createLogger();
  const syncGroupOutputs = outputs.filter((o) => o.hyloType === HYLO_TYPE_SYNC_GROUP);
  if (syncGroupOutputs.length > 1) {
    throw new Error(`The submission can't have more that one hyloType='sync-group' outputs`);
  }
  for (const output of syncGroupOutputs) {
    try {
      const result = await _handleSyncGroupOutput({
        output,
        user,
        group: submission.meta.group,
        hyloGroupId: find(prevSubmission?.meta?.permanentResults || [], {
          type: API_COMPOSE_TYPE_HYLO,
          hyloType: HYLO_TYPE_SYNC_GROUP,
        })?.createdHyloGroup?.id,
        logger,
      });
      result.logs = logger.getLogs();
      results.push(result);
    } catch (e) {
      e.logs = logger.getLogs();
      throw e;
    }
  }

  return results;
};
