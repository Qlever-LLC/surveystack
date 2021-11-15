// TODO cleanup the tests once the requirements are finalized

import { normalizedSurveyControls, diffControls, changeType, diffSurveyVersions } from './surveyDiff';
import { cloneDeep, find } from 'lodash';
import { createControlInstance } from './surveyConfig';

const createControl = ({ type, ...overrides }) => ({
  ...createControlInstance({ type }),
  ...overrides,
});

const changeAllControlIds = (controls) =>
  controls.forEach((c) => {
    c.id = Math.random().toString();
    if (c.children) {
      changeAllControlIds(c.children);
    }
  });

describe.only('surveyDiff', () => {
  describe('normalizedSurveyControls', () => {
    function sameItems(arr1, arr2) {
      return expect(new Set(arr1)).toEqual(new Set(arr2));
    }

    it('can normalize pages', () => {
      const num = createControl({ type: 'number', name: 'number_1' });
      const str = createControl({ type: 'string', name: 'string_1' });
      const page = createControl({ type: 'page', name: 'page_1', children: [num, str] });
      const normalized = normalizedSurveyControls([page]);
      sameItems(Object.keys(normalized), [num.id, str.id, page.id]);
    });

    it('can normalize groups', () => {
      const num = createControl({ type: 'number', name: 'number_1' });
      const str = createControl({ type: 'string', name: 'string_1' });
      const group = createControl({ type: 'group', name: 'group_1', children: [num, str] });
      const normalized = normalizedSurveyControls([group]);
      sameItems(Object.keys(normalized), [num.id, str.id, group.id]);
    });

    const createTestControls = () => [
      createControl({ type: 'number', name: 'number_1', id: 'num_1' }),
      createControl({
        type: 'page',
        name: 'page_1',
        id: 'pag_1',
        children: [
          createControl({ type: 'string', name: 'string_1', id: 'str_1' }),
          createControl({
            type: 'group',
            name: 'group_1',
            id: 'grp_1',
            children: [
              createControl({ type: 'number', name: 'number_2', id: 'num_2' }),
              createControl({ type: 'string', name: 'string_2', id: 'str_2' }),
            ],
          }),
        ],
      }),
      createControl({ type: 'number', name: 'number_3', id: 'num_3' }),
    ];

    it('sets parentId', () => {
      const controls = createTestControls();
      const normalized = normalizedSurveyControls(controls);
      expect(normalized['num_1'].parentId).toBeNull();
      expect(normalized['pag_1'].parentId).toBeNull();
      expect(normalized['str_1'].parentId).toBe('pag_1');
      expect(normalized['grp_1'].parentId).toBe('pag_1');
      expect(normalized['num_2'].parentId).toBe('grp_1');
      expect(normalized['str_2'].parentId).toBe('grp_1');
      expect(normalized['num_3'].parentId).toBeNull();
    });

    it('sets childIndex', () => {
      const controls = createTestControls();
      const normalized = normalizedSurveyControls(controls);
      expect(normalized['num_1'].childIndex).toBe(0);
      expect(normalized['pag_1'].childIndex).toBe(1);
      expect(normalized['str_1'].childIndex).toBe(0);
      expect(normalized['grp_1'].childIndex).toBe(1);
      expect(normalized['num_2'].childIndex).toBe(0);
      expect(normalized['str_2'].childIndex).toBe(1);
      expect(normalized['num_3'].childIndex).toBe(2);
    });

    it('sets control', () => {
      const controls = createTestControls();
      const normalized = normalizedSurveyControls(controls);
      expect(normalized['num_1'].control).toBe(controls[0]);
      expect(normalized['pag_1'].control).toBe(controls[1]);
      expect(normalized['str_1'].control).toBe(controls[1].children[0]);
      expect(normalized['grp_1'].control).toBe(controls[1].children[1]);
      expect(normalized['num_2'].control).toBe(controls[1].children[1].children[0]);
      expect(normalized['str_2'].control).toBe(controls[1].children[1].children[1]);
      expect(normalized['num_3'].control).toBe(controls[2]);
    });
  });
  describe('diffControls', () => {
    it('works', () => {
      const oldNum = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
      const newNum = cloneDeep(oldNum);
      newNum.name += 'changed';

      const diff = diffControls(oldNum, newNum);

      expect(diff).toHaveProperty('name.changeType', changeType.CHANGED);
      expect(diff).toHaveProperty('name.oldValue', oldNum.name);
      expect(diff).toHaveProperty('name.newValue', newNum.name);
      expect(diff).toHaveProperty('label.changeType', changeType.UNCHANGED);
    });
    it('works with array values', () => {
      const oldControl = createControlInstance({ type: 'selectMultiple', name: 'sm_1' });
      oldControl.options.source.push({ a: 1 }, { b: 2 }, { c: 3 });
      const newControl = cloneDeep(oldControl);

      const diff = diffControls(oldControl, newControl);
      expect(diff).toHaveProperty(['options.source[0].a', 'changeType'], changeType.UNCHANGED);
    });
  });
  describe('diffSurveyVersions', () => {
    it('works', () => {
      const oldNum = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
      const newNum = cloneDeep(oldNum);
      newNum.name += 'changed';

      const diff = diffSurveyVersions([oldNum], [newNum]);

      expect(diff).toHaveLength(1);
      const numDiff = diff[0];
      expect(numDiff).toHaveProperty('changeType', changeType.CHANGED);
      expect(numDiff).toHaveProperty('matchId', oldNum.id);
      expect(numDiff).toHaveProperty('diff.name.changeType', changeType.CHANGED);
      expect(numDiff).toHaveProperty('diff.name.oldValue', oldNum.name);
      expect(numDiff).toHaveProperty('diff.name.newValue', newNum.name);
      expect(numDiff).toHaveProperty('diff.label.changeType', changeType.UNCHANGED);
    });
    it('withMatrices', () => {
      const oldMat = createControlInstance({ type: 'matrix', name: 'mat_1' });
      oldMat.options.source.content[0].label = 'Col 1';
      const newMat = cloneDeep(oldMat);
      newMat.options.source.config.addRowLabel = 'Insert Row';
      newMat.options.source.content[0].label = 'First Col';

      const diff = diffSurveyVersions([oldMat], [newMat]);

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
    // TODO 'selectSingle', 'selectMultiple'
    describe('works with path ids', () => {
      const num1 = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
      const num2 = createControlInstance({ type: 'number', name: 'number_2', label: 'foo' });
      const group1 = createControlInstance({ type: 'group', name: 'group_1', children: [num2] });
      const oldControls = [num1, group1];
      const newControls = cloneDeep(oldControls);
      changeAllControlIds(newControls);

      newControls[0] = createControlInstance({ type: 'string', name: num1.name });
      newControls[1].children[0].label = 'baz';
      const diff = diffSurveyVersions(oldControls, newControls, { useControlPathAsId: true });

      it('matches controls with the same path', () => {
        const path = 'group_1.number_2';
        const num2Diff = find(diff, { newPath: path });
        expect(num2Diff).toHaveProperty('changeType', changeType.CHANGED);
        expect(num2Diff).toHaveProperty('oldPath', path);
        expect(num2Diff).toHaveProperty('matchId', path);
        expect(num2Diff).toHaveProperty('diff.label.changeType', changeType.CHANGED);
        expect(num2Diff).toHaveProperty('diff.label.oldValue', oldControls[1].children[0].label);
        expect(num2Diff).toHaveProperty('diff.label.newValue', newControls[1].children[0].label);
        expect(num2Diff).toHaveProperty('diff.name.changeType', changeType.UNCHANGED);
      });

      it('treats type change as "remove" and "add', () => {
        const num1OldDiff = find(diff, { oldPath: 'number_1' });
        expect(num1OldDiff).toHaveProperty('changeType', changeType.REMOVED);
        expect(num1OldDiff).toHaveProperty('oldControl.type', oldControls[0].type);
        const num1NewDiff = find(diff, { newPath: 'number_1' });
        expect(num1NewDiff).toHaveProperty('changeType', changeType.ADDED);
        expect(num1NewDiff).toHaveProperty('newControl.type', newControls[0].type);
      });
    });
  });
});
