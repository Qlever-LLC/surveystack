import ObjectID from 'bson-objectid';

const createMockSubmission = ({
  _id = new ObjectID().toString(),
  dateModified = new Date(),
} = {}) => ({
  _id,
  meta: {
    dateModified,
  }
});

export { createMockSubmission };
