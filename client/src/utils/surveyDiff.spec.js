import {
  flatSurveyControls,
  diffControls,
  changeType,
  diffSurveyVersions,
  merge,
  diffThreeSurveyVersions,
} from './surveyDiff';
import { cloneDeep, find, uniqueId, set, map } from 'lodash';
import { createControlInstance } from './surveyConfig';

const createControl = ({ type, ...overrides }) => ({
  ...createControlInstance({ type }),
  name: `${type}_${uniqueId()}`,
  ...overrides,
});

const changeAllControlIds = (controls) =>
  controls.forEach((c) => {
    c.id = Math.random().toString();
    if (c.children) {
      changeAllControlIds(c.children);
    }
  });

describe('surveyDiff', () => {
  describe('flatSurveyControls', () => {
    function sameItems(arr1, arr2) {
      return expect(new Set(arr1)).toEqual(new Set(arr2));
    }

    it('can flatten pages', () => {
      const num = createControl({ type: 'number', name: 'number_1' });
      const str = createControl({ type: 'string', name: 'string_1' });
      const page = createControl({ type: 'page', name: 'page_1', children: [num, str] });
      const normalized = flatSurveyControls([page]);
      sameItems(map(normalized, 'control'), [num, str, page]);
    });

    it('can flatten groups', () => {
      const num = createControl({ type: 'number', name: 'number_1' });
      const str = createControl({ type: 'string', name: 'string_1' });
      const group = createControl({ type: 'group', name: 'group_1', children: [num, str] });
      const normalized = flatSurveyControls([group]);
      sameItems(map(normalized, 'control'), [num, str, group]);
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
      const flatControls = flatSurveyControls(controls);
      expect(find(flatControls, ['control.id', 'num_1']).parentId).toBeNull();
      expect(find(flatControls, ['control.id', 'pag_1']).parentId).toBeNull();
      expect(find(flatControls, ['control.id', 'str_1']).parentId).toBe('pag_1');
      expect(find(flatControls, ['control.id', 'grp_1']).parentId).toBe('pag_1');
      expect(find(flatControls, ['control.id', 'num_2']).parentId).toBe('grp_1');
      expect(find(flatControls, ['control.id', 'str_2']).parentId).toBe('grp_1');
      expect(find(flatControls, ['control.id', 'num_3']).parentId).toBeNull();
    });

    it('sets childIndex', () => {
      const controls = createTestControls();
      const flatControls = flatSurveyControls(controls);
      expect(find(flatControls, ['control.id', 'num_1']).childIndex).toBe(0);
      expect(find(flatControls, ['control.id', 'pag_1']).childIndex).toBe(1);
      expect(find(flatControls, ['control.id', 'str_1']).childIndex).toBe(0);
      expect(find(flatControls, ['control.id', 'grp_1']).childIndex).toBe(1);
      expect(find(flatControls, ['control.id', 'num_2']).childIndex).toBe(0);
      expect(find(flatControls, ['control.id', 'str_2']).childIndex).toBe(1);
      expect(find(flatControls, ['control.id', 'num_3']).childIndex).toBe(2);
    });

    it('sets control', () => {
      const controls = createTestControls();
      const flatControls = flatSurveyControls(controls);
      expect(find(flatControls, ['control.id', 'num_1']).control).toBe(controls[0]);
      expect(find(flatControls, ['control.id', 'pag_1']).control).toBe(controls[1]);
      expect(find(flatControls, ['control.id', 'str_1']).control).toBe(controls[1].children[0]);
      expect(find(flatControls, ['control.id', 'grp_1']).control).toBe(controls[1].children[1]);
      expect(find(flatControls, ['control.id', 'num_2']).control).toBe(controls[1].children[1].children[0]);
      expect(find(flatControls, ['control.id', 'str_2']).control).toBe(controls[1].children[1].children[1]);
      expect(find(flatControls, ['control.id', 'num_3']).control).toBe(controls[2]);
    });
  });

  describe('diffControls', () => {
    it("throws when control types don't match", () => {
      expect(() => diffControls(createControl({ type: 'number' }), createControl({ type: 'string' }))).toThrow(
        "Control types don't match"
      );
    });
    it('compares all the common fileds', () => {
      const commonFields = [
        'type',
        'name',
        'label',
        'options.readOnly',
        'options.required',
        'options.redacted',
        'options.relevance.enabled',
        'options.relevance.code',
        'options.constraint.enabled',
        'options.constraint.code',
        'options.calculate.enabled',
        'options.calculate.code',
        'options.apiCompose.enabled',
        'options.apiCompose.code',
      ];
      const control = createControl({ type: 'number', label: 'number label' });

      const diff = diffControls(control, control);
      commonFields.forEach((field) => {
        expect(diff).toHaveProperty([field, 'changeType'], changeType.UNCHANGED);
      });
    });
    it('does not compare blacklisted fileds', () => {
      const blacklisteds = ['id', 'children', 'libraryId', 'libraryIsInherited', 'libraryVersion'];
      const control = createControl({
        type: 'group',
        hint: 'this is a hint',
        libraryId: 'lib-id',
        libraryIsInherited: true,
        libraryVersion: 5,
      });

      const diff = diffControls(control, control);
      blacklisteds.forEach((field) => {
        expect(diff).not.toHaveProperty([field, 'changeType'], changeType.UNCHANGED);
      });
    });
    it('reports change', () => {
      const oldNum = createControl({ type: 'number', name: 'number_1' });
      const newNum = cloneDeep(oldNum);
      newNum.name += 'changed';

      const diff = diffControls(oldNum, newNum);

      expect(diff.name).toMatchObject({
        changeType: changeType.CHANGED,
        valueA: oldNum.name,
        valueB: newNum.name,
      });
    });
    it('reports no-change', () => {
      const control = createControl({ type: 'number', name: 'number_1' });

      const diff = diffControls(control, control);

      expect(diff.name).toMatchObject({
        changeType: changeType.UNCHANGED,
        value: control.name,
      });
    });
    it('reports removal', () => {
      const oldNum = createControl({ type: 'number', label: 'some_value' });
      const newNum = cloneDeep(oldNum);
      delete newNum.label;

      const diff = diffControls(oldNum, newNum);

      expect(diff.label).toMatchObject({
        changeType: changeType.REMOVED,
        valueA: oldNum.label,
        valueB: undefined,
      });
    });
    it('reports addition', () => {
      const oldNum = createControl({ type: 'number', label: 'some_value' });
      const newNum = cloneDeep(oldNum);
      delete oldNum.label;

      const diff = diffControls(oldNum, newNum);

      expect(diff.label).toMatchObject({
        changeType: changeType.ADDED,
        valueA: undefined,
        valueB: newNum.label,
      });
    });
    describe('controls with array type source', () => {
      [
        ['matrix', 'source.content'],
        ['selectSingle', 'source'],
        ['selectMultiple', 'source'],
      ].forEach(([type, srcPath]) => {
        it(`diffs options.${srcPath} of ${type} control`, () => {
          const oldControl = createControl({ type, name: 'control_1' });
          set(oldControl.options, srcPath, [{ foo: 1 }, { bar: 2 }, { baz: 3 }]);
          const newControl = cloneDeep(oldControl);
          set(newControl.options, `${srcPath}[1].bar`, 5);
          set(newControl.options, `${srcPath}[2].bux`, 6);
          set(newControl.options, `${srcPath}[2].baz`, null);

          const diff = diffControls(oldControl, newControl);
          expect(diff[`options.${srcPath}[0].foo`]).toMatchObject({
            changeType: changeType.UNCHANGED,
          });
          expect(diff[`options.${srcPath}[1].bar`]).toMatchObject({
            changeType: changeType.CHANGED,
            valueA: 2,
            valueB: 5,
          });
          expect(diff[`options.${srcPath}[2].baz`]).toMatchObject({
            changeType: changeType.REMOVED,
            valueA: 3,
            valueB: null,
          });
          expect(diff[`options.${srcPath}[2].bux`]).toMatchObject({
            changeType: changeType.ADDED,
            valueA: undefined,
            valueB: 6,
          });
        });
      });
    });
  });
  describe('diffSurveyVersions', () => {
    it('detects change', () => {
      const oldNum = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
      const newNum = cloneDeep(oldNum);
      newNum.name += 'changed';

      const diff = diffSurveyVersions([oldNum], [newNum]);

      expect(diff).toMatchObject([
        {
          changeType: changeType.CHANGED,
          controlRevisionB: newNum,
          childIndexRevisionB: 0,
          pathRevisionB: newNum.name,
          parentIdRevisionB: null,
          controlRevisionA: oldNum,
          childIndexRevisionA: 0,
          pathRevisionA: oldNum.name,
          parentIdRevisionA: null,
          diff: {
            name: {
              changeType: changeType.CHANGED,
              valueA: oldNum.name,
              valueB: newNum.name,
            },
            label: {
              changeType: changeType.UNCHANGED,
            },
          },
        },
      ]);
    });
    it('detects addition', () => {
      const num = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });

      const diff = diffSurveyVersions([], [num]);

      expect(diff).toMatchObject([
        {
          changeType: changeType.ADDED,
          controlRevisionB: num,
          childIndexRevisionB: 0,
          pathRevisionB: num.name,
          parentIdRevisionB: null,
        },
      ]);
    });
    it('detects removal', () => {
      const num = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });

      const diff = diffSurveyVersions([num], []);

      expect(diff).toMatchObject([
        {
          changeType: changeType.REMOVED,
          controlRevisionA: num,
          childIndexRevisionA: 0,
          pathRevisionA: num.name,
          parentIdRevisionA: null,
        },
      ]);
    });
    it('correctly diffs matrix content', () => {
      const oldMat = createControlInstance({ type: 'matrix', name: 'mat_1' });
      oldMat.options.source.content[0].label = 'Col 1';
      const newMat = cloneDeep(oldMat);
      newMat.options.source.config.addRowLabel = 'Insert Row';
      newMat.options.source.content[0].label = 'First Col';

      const diff = diffSurveyVersions([oldMat], [newMat]);

      expect(diff).toMatchObject([
        {
          changeType: changeType.CHANGED,

          controlRevisionB: newMat,
          childIndexRevisionB: 0,
          pathRevisionB: newMat.name,
          parentIdRevisionB: null,
          controlRevisionA: oldMat,
          childIndexRevisionA: 0,
          pathRevisionA: oldMat.name,
          parentIdRevisionA: null,
          diff: {
            'options.source.config.addRowLabel': {
              changeType: changeType.CHANGED,
              valueA: oldMat.options.source.config.addRowLabel,
              valueB: newMat.options.source.config.addRowLabel,
            },
            name: {
              changeType: changeType.UNCHANGED,
            },
            'options.source.content[0].label': {
              changeType: changeType.CHANGED,
              valueA: oldMat.options.source.content[0].label,
              valueB: newMat.options.source.content[0].label,
            },
          },
        },
      ]);
    });
    describe('matches by pathId when it can not find mach by control ID', () => {
      const createDiff = () => {
        const num1 = createControlInstance({ type: 'number', name: 'number_1', label: 'foo' });
        const num2 = createControlInstance({ type: 'number', name: 'number_2', label: 'foo' });
        const group1 = createControlInstance({ type: 'group', name: 'group_1', children: [num2] });
        const oldControls = [num1, group1];
        const newControls = cloneDeep(oldControls);
        changeAllControlIds(newControls);

        newControls[0] = createControlInstance({ type: 'string', name: num1.name });
        newControls[1].children[0].label = 'baz';
        const diff = diffSurveyVersions(oldControls, newControls);
        return { diff, oldControls, newControls };
      };

      it('matches controls with the same path', () => {
        const { diff, oldControls, newControls } = createDiff();
        const path = 'group_1.number_2';
        const num2Diff = find(diff, { pathRevisionB: path });
        expect(num2Diff).toHaveProperty('changeType', changeType.CHANGED);
        expect(num2Diff).toHaveProperty('pathRevisionA', path);
        expect(num2Diff).toHaveProperty('diff.label.changeType', changeType.CHANGED);
        expect(num2Diff).toHaveProperty('diff.label.valueA', oldControls[1].children[0].label);
        expect(num2Diff).toHaveProperty('diff.label.valueB', newControls[1].children[0].label);
        expect(num2Diff).toHaveProperty('diff.name.changeType', changeType.UNCHANGED);
      });

      it('treats type change as "remove" and "add', () => {
        const { diff, oldControls, newControls } = createDiff();
        const num1OldDiff = find(diff, { pathRevisionA: 'number_1' });
        expect(num1OldDiff).toHaveProperty('changeType', changeType.REMOVED);
        expect(num1OldDiff).toHaveProperty('controlRevisionA.type', oldControls[0].type);
        const num1NewDiff = find(diff, { pathRevisionB: 'number_1' });
        expect(num1NewDiff).toHaveProperty('changeType', changeType.ADDED);
        expect(num1NewDiff).toHaveProperty('controlRevisionB.type', newControls[0].type);
      });
    });
  });
  describe('diffThreeSurveyVersions', () => {
    it('contains the property values for revisions A,B and C of a diff', () => {
      const controlLocalVersion = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo_one',
      });
      const controlRemoteVersionA = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo_two',
      });
      const controlRemoteVersionB = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo_three',
      });

      const diff = diffThreeSurveyVersions([controlLocalVersion], [controlRemoteVersionA], [controlRemoteVersionB]);
      expect(diff[0].changeType).toBe(changeType.CHANGED);
      expect(diff[0].diff.name).toBeDefined();
      expect(diff[0].diff.name.valueB).toBe(controlRemoteVersionA.name);
      expect(diff[0].diff.name.valueC).toBe(controlRemoteVersionB.name);
      expect(diff[0].diff.name.valueA).toBe(controlLocalVersion.name);
    });
    it('returns remote control instead of changed local control in case of breaking remote change', () => {
      const controlLocalVersion = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: true, hidden: true },
      });
      const controlRemoteVersionA = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: true },
      });
      const controlRemoteVersionB = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: false },
      });

      const diff = diffThreeSurveyVersions([controlLocalVersion], [controlRemoteVersionA], [controlRemoteVersionB]);

      expect(diff).toMatchObject([
        {
          changeType: changeType.CHANGED,
          hasBreakingChange: true,
          hasLocalChange: true,
          controlRevisionA: controlLocalVersion,
          childIndexRevisionA: 0,
          pathRevisionA: controlLocalVersion.name,
          parentIdRevisionA: null,
          controlRevisionB: controlRemoteVersionA,
          childIndexRevisionB: 0,
          pathRevisionB: controlRemoteVersionA.name,
          parentIdRevisionB: null,
          controlRevisionC: controlRemoteVersionB,
          childIndexRevisionC: 0,
          pathRevisionC: controlRemoteVersionB.name,
          parentIdRevisionC: null,

          diff: {
            'options.allowHide': {
              changeType: changeType.CHANGED,
              valueA: controlLocalVersion.options.allowHide,
              valueB: controlRemoteVersionA.options.allowHide,
              valueC: undefined, //yes, it's not false, cause some sanitation in place sets false to undefined
            },
            'options.hidden': {
              changeType: changeType.CHANGED,
              valueA: controlLocalVersion.options.hidden,
              valueB: controlRemoteVersionA.options.hidden,
              valueC: controlRemoteVersionB.options.hidden,
            },
          },
        },
      ]);
    });
    it('does not return conflicting changes in case of no local change', () => {
      const controlLocalVersion = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: true },
      });
      const controlRemoteVersionA = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: true },
      });
      const controlRemoteVersionB = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: false },
      });

      const diff = diffThreeSurveyVersions(
        [controlLocalVersion],
        [controlRemoteVersionA],
        [controlRemoteVersionB],
        false
      );

      expect(diff).toMatchObject([
        {
          changeType: changeType.CHANGED,
          hasLocalChange: false,
          controlRevisionA: controlLocalVersion,
          childIndexRevisionA: 0,
          pathRevisionA: controlLocalVersion.name,
          parentIdRevisionA: null,
          controlRevisionB: controlRemoteVersionA,
          childIndexRevisionB: 0,
          pathRevisionB: controlRemoteVersionA.name,
          parentIdRevisionB: null,
          controlRevisionC: controlRemoteVersionB,
          childIndexRevisionC: 0,
          pathRevisionC: controlRemoteVersionB.name,
          parentIdRevisionC: null,

          diff: {
            'options.allowHide': {
              changeType: changeType.CHANGED,
              valueA: controlLocalVersion.options.allowHide,
              valueB: controlRemoteVersionA.options.allowHide,
              valueC: undefined, //yes, it's not false, cause some sanitation in place sets false to undefined
            },
          },
        },
      ]);
    });
    it('handles when control was replaced in the remote and changed in the local', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      // same control with different label/name
      const textControlReplaced = createControlInstance({
        type: 'text',
        name: 'bazz_1',
        label: 'bazzz',
      });
      const textControlChanged = { ...textControl, label: textControl.label + '-change' };
      const diffBasedOnRemote = diffThreeSurveyVersions(
        [numberControl, textControlChanged],
        [numberControl, textControl],
        [numberControl, textControlReplaced],
        false
      );
      expect(diffBasedOnRemote.length).toBe(3);
      const diffBasedOnLocal = diffThreeSurveyVersions(
        [numberControl, textControlChanged],
        [numberControl, textControl],
        [numberControl, textControlReplaced],
        true
      );
      expect(diffBasedOnLocal.length).toBe(2);
    });
  });
  describe('merge', () => {
    it('adds new controls', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const mergeResult = merge([numberControl], [numberControl], [numberControl, textControl]);
      expect(mergeResult.length).toBe(2);
    });
    it('removes deleted controls', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const mergeResult = merge([numberControl, textControl], [numberControl, textControl], [numberControl]);
      expect(mergeResult.length).toBe(1);
    });
    it('replaces changed controls if no local change', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const textControlChanged = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar_changed',
      });
      const mergeResult = merge(
        [numberControl, textControl],
        [numberControl, textControl],
        [numberControl, textControlChanged]
      );
      expect(mergeResult[1].label).toBe('bar_changed');
    });
    it('preserves locally added control', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const mergeResult = merge([numberControl, textControl], [numberControl], [numberControl]);
      expect(mergeResult.length).toBe(2);
      expect(mergeResult[1].name).toBe('text_1');
    });
    it('preserves locally added control if parent group is deleted in remote revision', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const textControl2 = createControlInstance({
        type: 'text',
        name: 'text_2',
        label: 'baz',
      });
      const groupLocal = createControlInstance({
        type: 'group',
        name: 'group_1',
        children: [numberControl, textControl],
      });
      const groupRemote = createControlInstance({ type: 'group', name: 'group_1', children: [numberControl] });
      const mergeResult = merge([groupLocal, textControl2], [groupRemote, textControl2], [textControl2]);
      expect(mergeResult.length).toBe(2);
      expect(mergeResult[1]).toMatchObject(textControl);
    });
    it('preserves local control change when remote also changed', () => {
      const numberControlChanged = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo_changed',
      });
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const mergeResult = merge(
        [numberControlChanged, textControl],
        [numberControl, textControl],
        [numberControl, textControl]
      );
      expect(mergeResult[0].label).toBe('foo_changed');
    });
    it('replaces local control change if allowModify is turned off in remote control', () => {
      const numberControlLocal = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo_changed',
      });
      const numberControlRemoteA = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowModify: true },
      });
      const numberControlRemoteB = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowModify: false },
      });
      const mergeResult = merge([numberControlLocal], [numberControlRemoteA], [numberControlRemoteB]);
      expect(mergeResult[0].label).toBe('foo');
    });
    it('replaces local control change if allowHide is turned off in remote control', () => {
      const numberControlLocal = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { hidden: true },
      });
      const numberControlRemoteA = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: true },
      });
      const numberControlRemoteB = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
        options: { allowHide: false },
      });
      const mergeResult = merge([numberControlLocal], [numberControlRemoteA], [numberControlRemoteB]);
      expect(mergeResult[0].options.hidden).toBeFalsy();
    });
    it('removes deleted controls when they were changed locally', () => {
      const numberControl = createControlInstance({
        type: 'number',
        name: 'number_1',
        label: 'foo',
      });
      const textControl = createControlInstance({
        type: 'text',
        name: 'text_1',
        label: 'bar',
      });
      const textControlChanged = { ...textControl, label: textControl.label + '-change' };
      const mergeResult = merge([numberControl, textControlChanged], [numberControl, textControl], [numberControl]);
      expect(mergeResult.length).toBe(1);
    });
  });
});
