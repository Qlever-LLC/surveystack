import ObjectID from 'bson-objectid';

const createMockSubmission = ({ _id = new ObjectID().toString() } = {}) => ({
  _id,
});

export { createMockSubmission };
