import { normalizedSurveyControls, diffControls, changeType, diffSurveyVersions } from './surveyDiff';
import _, { defaults } from 'lodash';
import { createControlInstance } from './surveyConfig';

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
      const num = createControlInstance({ type: 'number', name: 'number_1' });
      const str = createControlInstance({ type: 'string', name: 'string_1' });
      const page = createControlInstance({ type: 'page', name: 'page_1', children: [num, str] });
      const normalized = normalizedSurveyControls(createRevision({ controls: [page] }));
      sameItems(Object.keys(normalized), [num.id, str.id, page.id]);
    });
  });
  describe('diffControls', () => {
    it('works', () => {
      const oldNum = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
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
    it('works', () => {
      const oldNum = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
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
    });
    it('withMatrices', () => {
      const oldMat = createControlInstance({ type: 'matrix', name: 'mat_1' });
      oldMat.options.source.content[0].label = 'Col 1';
      const newMat = _.cloneDeep(oldMat);
      newMat.options.source.config.addRowLabel = 'Insert Row';
      newMat.options.source.content[0].label = 'First Col';
      const oldRevision = createRevision({ version: 1, controls: [oldMat] });
      const newRevision = createRevision({ version: 2, controls: [newMat] });

      const diff = diffSurveyVersions(oldRevision, newRevision);

      expect(diff).toHaveLength(1);
      const matDiff = diff[0];
      expect(matDiff).toHaveProperty('changeType', changeType.CHANGED);
      expect(matDiff).toHaveProperty(['diff', 'options.source.config.addRowLabel', 'changeType'], changeType.CHANGED);
      expect(matDiff).toHaveProperty(
        ['diff', 'options.source.config.addRowLabel', 'oldValue'],
        oldMat.options.source.config.addRowLabel
      );
      expect(matDiff).toHaveProperty(
        ['diff', 'options.source.config.addRowLabel', 'newValue'],
        newMat.options.source.config.addRowLabel
      );
      expect(matDiff).toHaveProperty('diff.name.changeType', changeType.UNCHANGED);
      expect(matDiff).toHaveProperty(['diff', 'options.source.content[0].label', 'changeType'], changeType.CHANGED);
      expect(matDiff).toHaveProperty(
        ['diff', 'options.source.content[0].label', 'oldValue'],
        oldMat.options.source.content[0].label
      );
      expect(matDiff).toHaveProperty(
        ['diff', 'options.source.content[0].label', 'newValue'],
        newMat.options.source.content[0].label
      );
    });
  });
});
