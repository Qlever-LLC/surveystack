const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../../db');

const createScript = async ({ group }) => {
  const script = {
    name: 'script name',
    content: 'script content',
    meta: {
      creator: null,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      group,
      revision: 1,
      specVersion: 2,
    },
    _id: new ObjectId(),
  };
  await getDb().collection('scripts').insertOne(script);
  return script;
};

export { createScript };
