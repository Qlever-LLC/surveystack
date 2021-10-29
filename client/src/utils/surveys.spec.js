import { findControlById, findParentByChildId, getPosition, insertControl } from './surveys';

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
    const control = {
      name: 'instructions_2',
      label: 'Instructions 2',
      type: 'instructions',
      _id: '5e8509f98ff5690001eeda5a',
      value: null,
    };
    const position = [0];
    insertControl(control, controls, position, false);
    expect(controls.length).toBe(3);
  });
  test('insertControl of a group is inserted into the selected group', () => {
    const newGroup = {
      name: 'group_new',
      label: 'My new group',
      type: 'group',
      _id: '5e8508eeba06570001c46b17',
    };
    const selectedControl = controls[0];
    const position = getPosition(selectedControl, controls);
    insertControl(newGroup, controls, position, true);
    expect(controls[0].children[1].name).toBe(newGroup.name);
  });
  test('insertControl of a page is inserted after the selected component, not in selected component', () => {
    const newPage = {
      name: 'page_new',
      label: 'My new page',
      type: 'page',
      _id: '5e8508eeba06570001c46b17',
    };
    const selectedControl = controls[0];
    const position = getPosition(selectedControl, controls);
    insertControl(newPage, controls, position, true);
    expect(controls[1].name).toBe(newPage.name);
  });
});
