import { normalizedSurveyControls, diffControls, changeType, diffSurveyVersions } from './surveyDiff';
import _, { defaults } from 'lodash';

function createControl(overrides) {
  const defaultName = `${overrides.type || 'control'}_${_.uniqueId()}`;
  const defaults = {
    id: defaultName,
    name: defaultName,
    label: '',
    hint: '',
    options: {
      readOnly: false,
      required: false,
      redacted: false,
      relevance: { enabled: false, code: '' },
      constraint: { enabled: false, code: '' },
      calculate: { enabled: false, code: '' },
      apiCompose: { enabled: false, code: '' },
    },
  };
  return { ...defaults, ...overrides };
}

function createRevision(overrides) {
  const defaults = {
    dateCreated: new Date(),
    version: 1,
    controls: [],
  };
  return { ...defaults, ...overrides };
}

function sameItems(arr1, arr2) {
  return expect(new Set(arr1)).toEqual(new Set(arr2));
}

describe.only('surveyDiff', () => {
  describe('normalizedSurveyControls', () => {
    it('works', () => {
      const num = createControl({ type: 'number' });
      const str = createControl({ type: 'string' });
      const page = createControl({ type: 'page', children: [num, str] });
      const normalized = normalizedSurveyControls({ revisions: [{ version: 1, controls: [page] }] }, 1);
      sameItems(Object.keys(normalized), [num.id, str.id, page.id]);
    });
  });
  describe('diffControls', () => {
    it('works', () => {
      const oldNum = createControl({ type: 'number', label: 'foo' });
      const newNum = _.cloneDeep(oldNum);
      newNum.name += 'changed';

      const diff = diffControls(oldNum, newNum);

      expect(diff).toHaveProperty('name.changeType', changeType.CHANGED);
      expect(diff).toHaveProperty('name.oldValue', oldNum.name);
      expect(diff).toHaveProperty('name.newValue', newNum.name);
      expect(diff).toHaveProperty('label.changeType', changeType.UNCHANGED);
    });
  });
  describe('diffSurveyVersions', () => {
    it.only('works', () => {
      const oldNum = createControl({ type: 'number', label: 'foo' });
      const newNum = _.cloneDeep(oldNum);
      newNum.name += 'changed';
      const oldRevision = createRevision({ version: 1, controls: [oldNum] });
      const newRevision = createRevision({ version: 2, controls: [newNum] });

      const diff = diffSurveyVersions(oldRevision, newRevision);

      expect(diff).toHaveLength(1);
      const numDiff = diff[0];
      expect(numDiff).toHaveProperty('changeType', changeType.CHANGED);
      expect(numDiff).toHaveProperty('diff.name.changeType', changeType.CHANGED);
      expect(numDiff).toHaveProperty('diff.name.oldValue', oldNum.name);
      expect(numDiff).toHaveProperty('diff.name.newValue', newNum.name);
      expect(numDiff).toHaveProperty('diff.label.changeType', changeType.UNCHANGED);

      //   expect(diff).toHaveProperty('name.changeType', changeType.CHANGE);
      //   expect(diff).toHaveProperty('name.oldValue', oldNum.name);
      //   expect(diff).toHaveProperty('name.newValue', newNum.name);
      //   expect(diff).toHaveProperty('label.changeType', changeType.UNCHANGED);
    });
  });
});
