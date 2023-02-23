/* eslint-disable */

/**
 * ApiCompose
 *
 * @param {submission} submission
 * @param {survey} survey
 * @param {parent} parent
 */
function apiCompose(submission, survey, parent) {
  return {
    type: 'hylo',
    hyloType: 'join-group',
    entity: {
      users: [
        {
          name: 'User 1',
          email: 'user1@our-sci.net',
        },
        {
          name: 'User 2',
          email: 'user2@our-sci.net',
        },
      ],
      groups: ['group1', 'group2'],
    },
  };
}
