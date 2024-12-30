const { ObjectId } = jest.requireActual('mongodb');

const createSurveyMetaPrintOptions = ({ showInstruction = true, showUnanswered = false } = {}) => ({
  showInstruction,
  showUnanswered,
});

const createSurveyMetaGroup = ({ id, path = '/mock-path/' } = {}) => {
  return {
    id: id ?? new ObjectId(),
    path,
  };
};

const createSurveyMeta = ({
  dateCreated,
  dateModified,
  submissions = 'public',
  creator,
  // Defaulting of group when it isn't passed is handled in createSurvey
  // Because of that, this function can't be used without passing it to createSurvey unless a group is specified.
  group,
  specVersion = 4,
  printOptions = createSurveyMetaPrintOptions(),
  isLibrary = false,
  archived = false,
} = {}) => {
  const now = new Date();
  return {
    dateCreated: dateCreated ?? now,
    dateModified: dateModified ?? now,
    submissions,
    creator: creator ?? new ObjectId(),
    group,
    specVersion,
    printOptions,
    isLibrary,
    archived,
  };
};

export { createSurveyMetaPrintOptions, createSurveyMetaGroup, createSurveyMeta };
