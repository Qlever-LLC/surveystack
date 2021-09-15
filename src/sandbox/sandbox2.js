import { ObjectId } from 'mongodb';
const db = {};

/*
// This may be a better way to store roles, however, a lookup on the nested groups is more complicated
const userWithRoles = {
  email: 'user@gmx.ch',
  name: 'User William Roles',
  roles: [
    { group: '5e6f8bbeea14550001470c28', type: 'admin' },
    { group: '5e789e8a9f0a2b00018f7c27', type: 'user' },
  ],
};

// find users in group 5e6f8bbeea14550001470c28
// and then also filter their roles to only contain this group
const matchStage = {"roles.group": ObjectId('5e6f8bbeea14550001470c28')},
const projectStage = {
  $project: {
    email: 1,
    name: 1,
    roles: {
      $filter: {
        input: '$roles',
        as: 'role',
        cond: { $in: ['$$role.group', [ObjectId('5e6f8bbeea14550001470c28')]] },
      },
    },
  },
};

*/

// The following query only really works if members can be just one role (user, admin)
// since there is a $group stage with 'type'
//db.users.aggregate([{$unwind: "$roles"}, {$lookup: {from: "groups", localField: "roles.group", foreignField: "_id", as: "roles.groupDetail"}}, {$unwind: "$roles.groupDetail"},{$group: {_id: "$_id", "email": {$first: "$email"}, "name": {$first: "$name"}, "roles": {$push: "$roles"}}}]).pretty()

// Also apply projection on lookup, and then also filter groups in project stage at the end
// db.users.aggregate([{$unwind: "$roles"}, {$lookup: {from: "groups", let: {groupId: "$roles.group"}, pipeline: [{$match: {$expr: {$eq: ["$_id", "$$groupId"]}}},{$project: {_id: 1, name: 1}}],as: "roles.groupDetail"}}, {$unwind: "$roles.groupDetail"},{$group: {_id: "$_id", "email": {$first: "$email"}, "name": {$first: "$name"}, "roles": {$push: "$roles"}}}]).pretty()
var mGroups = [ObjectId('5e6f8bbeea14550001470c28'), ObjectId('5e789e8a9f0a2b00018f7c27')];
db.users.aggregate([
  { $match: { 'roles.group': { $in: mGroups } } },
  { $unwind: '$roles' },
  {
    $lookup: {
      from: 'groups',
      let: { groupId: '$roles.group' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$groupId'] } } },
        { $project: { _id: 1, name: 1 } },
      ],
      as: 'roles.groupDetail',
    },
  },
  { $unwind: '$roles.groupDetail' },
  {
    $group: {
      _id: '$_id',
      email: { $first: '$email' },
      name: { $first: '$name' },
      roles: { $push: '$roles' },
    },
  },
  {
    $project: {
      email: 1,
      name: 1,
      roles: {
        $filter: {
          input: '$roles',
          as: 'role',
          cond: { $in: ['$$role.group', mGroups] },
        },
      },
    },
  },
]);
