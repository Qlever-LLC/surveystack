import { findControlById, findParentByChildId, findGroups } from '@/utils/surveys';

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

describe.skip('surveys', () => {
  test('findControlById works', () => {
    const control = findControlById('5e8508eeba06570001c46b16', controls);
    expect(control.name).toBe('group_5');
  });

  test('findParentByChildId works', () => {
    const parent = findParentByChildId('5e8508f7ba06570001c46b19', controls);
    expect(parent.name).toBe('group_5');
  });

  test('findGroups works', () => {
    const groups = findGroups(controls);
    console.log(JSON.stringify(groups, null, 2));
  });
});
