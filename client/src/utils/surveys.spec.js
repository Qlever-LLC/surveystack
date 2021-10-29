import { findControlById, findParentByChildId, getPosition, insertControl, changeRecursive } from './surveys';
import { cloneDeep } from 'lodash';

const controls = [
  {
    name: 'group_1',
    label: 'My group 1',
    type: 'group',
    children: [
      {
        name: 'instructions_2',
        label: 'Instructions 2',
        type: 'instructions',
        _id: '5e8508e3ba06570001c46b0f',
        value: null,
      },
      {
        name: 'group_3',
        label: 'My group 3',
        type: 'group',
        children: [
          {
            name: 'instructions_4',
            label: 'Instructions 4',
            type: 'instructions',
            _id: '5e8508ecba06570001c46b14',
            value: null,
          },
          {
            name: 'group_5',
            label: 'My group 5',
            type: 'group',
            children: [
              {
                name: 'instructions_6',
                label: 'Instructions 6',
                type: 'instructions',
                _id: '5e8508f7ba06570001c46b19',
                value: null,
              },
            ],
            _id: '5e8508eeba06570001c46b16',
          },
        ],
        _id: '5e8508e6ba06570001c46b11',
      },
    ],
    _id: '5e8508e0ba06570001c46b0d',
  },
  {
    name: 'instructions_1',
    label: 'Instructions 1',
    type: 'instructions',
    _id: '5e8509f98ff5690001eeda5e',
    value: null,
  },
];

describe('surveys', () => {
  test.skip('findControlById works', () => {
    const control = findControlById('5e8508eeba06570001c46b16', controls);
    expect(control.name).toBe('group_5');
  });
  test.skip('findParentByChildId works', () => {
    const parent = findParentByChildId('5e8508f7ba06570001c46b19', controls);
    expect(parent.name).toBe('group_5');
  });
  test('insertControl into nested works', () => {
    let controlsCopy = cloneDeep(controls);
    const control = {
      name: 'instructions_2',
      label: 'Instructions 2',
      type: 'instructions',
      _id: '5e8509f98ff5690001eeda5a',
      value: null,
    };
    const position = [0];
    insertControl(control, controlsCopy, position, false);
    expect(controlsCopy.length).toBe(3);
  });
  test('insertControl of a group is inserted into the selected group', () => {
    let controlsCopy = cloneDeep(controls);
    const newGroup = {
      name: 'group_new',
      label: 'My new group',
      type: 'group',
      _id: '5e8508eeba06570001c46b17',
    };
    const selectedControl = controlsCopy[0];
    const position = getPosition(selectedControl, controlsCopy);
    insertControl(newGroup, controlsCopy, position, true);
    expect(controlsCopy[0].children[1].name).toBe(newGroup.name);
  });
  test('insertControl of a page is inserted after the selected component, not in selected component', () => {
    let controlsCopy = cloneDeep(controls);
    const newPage = {
      name: 'page_new',
      label: 'My new page',
      type: 'page',
      _id: '5e8508eeba06570001c46b17',
    };
    const selectedControl = controlsCopy[0];
    const position = getPosition(selectedControl, controlsCopy);
    insertControl(newPage, controlsCopy, position, true);
    expect(controlsCopy[1].name).toBe(newPage.name);
  });
  test('changeRecursive works', () => {
    let groupCopy = cloneDeep(controls[0]);
    changeRecursive(groupCopy, (control) => {
      control.name += '_x';
    });
    expect(groupCopy.name).toBe('group_1_x');
    expect(groupCopy.children[1].children[1].name).toBe('group_5_x');
  });
});
