import {
  findControlById,
  findParentByChildId,
  getPosition,
  insertControl,
  changeRecursive,
  getPreparedLibraryResources,
  getPreparedLibraryControls,
  prepareToAddFromLibrary,
} from './surveys';
import { resourceTypes } from '@/utils/resources';

function mockControls() {
  return [
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
}

function mockLibrarySurvey() {
  return {
    _id: '61813a7833922800016e2b12',
    name: 'main_qs',
    latestVersion: 2,
    meta: {
      dateCreated: '2021-11-02T13:17:44.567Z',
      dateModified: '2021-11-03T11:13:57.068+01:00',
      submissions: 'public',
      creator: '61517c38a7fd000001faae55',
      group: {
        id: '61517cb7a7fd000001faae57',
        path: '/a/',
      },
      specVersion: 4,
      libraryDescription: '<p>this is a main qs</p>',
      libraryApplications: '',
      libraryMaintainers: '',
      libraryHistory: '',
      libraryLastChangeType: '',
      isLibrary: true,
    },
    resources: [
      {
        label: 'Dropdown Items 1',
        name: 'dropdown_items_1',
        id: '61813b1d33922800016e2b5c',
        type: resourceTypes.ONTOLOGY_LIST,
        location: 'EMBEDDED',
        content: [
          {
            id: '61813b1f33922800016e2b60',
            label: 'label_1',
            value: 'value_1',
            tags: 'tags_1',
          },
          {
            id: '61813b2933922800016e2b65',
            label: 'label_2',
            value: 'value_2',
            tags: 'tags_2',
          },
          {
            id: '61813b2833922800016e2b63',
            label: 'label_3',
            value: 'value_3',
            tags: 'tags_3',
          },
        ],
      },
      {
        label: 'Dropdown Items 1',
        name: 'dropdown_items_1',
        id: '618260e5ec075200015b8b7f',
        type: resourceTypes.ONTOLOGY_LIST,
        location: 'EMBEDDED',
        content: [
          {
            id: '61813aea33922800016e2b4b',
            label: 'label_a',
            value: 'value_a',
            tags: 'tags_a',
          },
          {
            id: '61813af533922800016e2b4e',
            label: 'label_b',
            value: 'value_b',
            tags: 'tags_b',
          },
          {
            id: '61813b0333922800016e2b51',
            label: 'label_c',
            value: 'value_c',
            tags: 'tags_c',
          },
        ],
        libraryId: '61813abc33922800016e2b2d',
        libraryVersion: 7,
      },
      {
        label: 'Dropdown Items 1',
        name: 'dropdown_items_1',
        id: '618260e5ec075200015b8b80',
        type: resourceTypes.ONTOLOGY_LIST,
        location: 'EMBEDDED',
        content: [
          {
            id: '61813aea33922800016e2b4b',
            label: 'label_a',
            value: 'value_a',
            tags: 'tags_a',
          },
          {
            id: '61813af533922800016e2b4e',
            label: 'label_b',
            value: 'value_b',
            tags: 'tags_b',
          },
          {
            id: '61813b0333922800016e2b51',
            label: 'label_c',
            value: 'value_c',
            tags: 'tags_c',
          },
        ],
        libraryId: '61813abc33922800016e2b2d',
        libraryVersion: 4,
        libraryIsInherited: true,
      },
    ],
    revisions: [
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 1,
        controls: [],
      },
      {
        dateCreated: '2021-11-03T11:13:57.068+01:00',
        version: 2,
        controls: [
          {
            name: 'text_1',
            label: 'Enter some text 1',
            type: 'string',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            id: '61813a8d33922800016e2b14',
            hint: '',
            value: null,
          },
          {
            name: 'dropdown_2',
            label: 'Dropdown 2',
            type: 'ontology',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
              source: '61813b1d33922800016e2b5c',
            },
            id: '61813a9133922800016e2b16',
            hint: '',
            value: null,
          },
          {
            name: 'inner_qs',
            label: 'inner qs',
            type: 'group',
            children: [
              {
                name: 'text3',
                label: 'Enter some text 3',
                type: 'string',
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
                  relevance: {
                    enabled: false,
                    code: '',
                  },
                  constraint: {
                    enabled: false,
                    code: '',
                  },
                  calculate: {
                    enabled: false,
                    code: '',
                  },
                  apiCompose: {
                    enabled: false,
                    code: '',
                  },
                },
                id: '618260e5ec075200015b8b81',
                hint: '',
                value: null,
                libraryId: '61813abc33922800016e2b2d',
                libraryVersion: 7,
              },
              {
                name: 'dropdown_4',
                label: 'Dropdown 4',
                type: 'ontology',
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
                  relevance: {
                    enabled: false,
                    code: '',
                  },
                  constraint: {
                    enabled: false,
                    code: '',
                  },
                  calculate: {
                    enabled: false,
                    code: '',
                  },
                  apiCompose: {
                    enabled: false,
                    code: '',
                  },
                  source: '61813ae533922800016e2b47',
                },
                id: '618260e5ec075200015b8b82',
                hint: '',
                value: null,
                libraryId: '61813abc33922800016e2b2d',
                libraryVersion: 7,
              },
            ],
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            id: '61825660ec075200015b8ad0',
            isLibraryRoot: true,
            libraryId: '61813abc33922800016e2b2d',
            libraryVersion: 7,
          },
        ],
      },
    ],
  };
}

describe('surveys', () => {
  test.skip('findControlById works', () => {
    const control = findControlById('5e8508eeba06570001c46b16', mockControls());
    expect(control.name).toBe('group_5');
  });
  test.skip('findParentByChildId works', () => {
    const parent = findParentByChildId('5e8508f7ba06570001c46b19', mockControls());
    expect(parent.name).toBe('group_5');
  });
  test('insertControl into nested works', () => {
    let controls = mockControls();
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
    let controls = mockControls();
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
    let controls = mockControls();
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
  test('changeRecursive works', () => {
    let group = mockControls()[0];
    changeRecursive(group, (control) => {
      control.name += '_x';
    });
    expect(group.name).toBe('group_1_x');
    expect(group.children[1].children[1].name).toBe('group_5_x');
  });
  test('prepareToAddFromLibrary sets libraryId to librarySurvey.id for resources/controls not inherited from nested question sets and does not set libraryIsInherited', () => {
    let librarySurvey = mockLibrarySurvey();
    prepareToAddFromLibrary(librarySurvey.resources[0], librarySurvey._id, librarySurvey.latestVersion);
    expect(librarySurvey.resources[0].libraryId).toBe(librarySurvey._id);
    expect(librarySurvey.resources[0].libraryIsInherited).toBe(undefined);
    prepareToAddFromLibrary(librarySurvey.revisions[1].controls[0], librarySurvey._id, librarySurvey.latestVersion);
    expect(librarySurvey.revisions[1].controls[0].libraryId).toBe(librarySurvey._id);
    expect(librarySurvey.revisions[1].controls[0].libraryIsInherited).toBe(undefined);
  });
  test('prepareToAddFromLibrary sets libraryIsInherited to true for resources/controls of nested question sets and leaves libraryId as is', () => {
    let librarySurvey = mockLibrarySurvey();
    prepareToAddFromLibrary(librarySurvey.resources[1], librarySurvey._id, librarySurvey.latestVersion);
    expect(librarySurvey.resources[1].libraryId).toBe(librarySurvey.revisions[1].controls[2].libraryId);
    expect(librarySurvey.resources[1].libraryIsInherited).toBe(true);
    prepareToAddFromLibrary(librarySurvey.revisions[1].controls[2], librarySurvey._id, librarySurvey.latestVersion);
    expect(librarySurvey.revisions[1].controls[2].libraryId).toBe(librarySurvey.revisions[1].controls[2].libraryId);
    expect(librarySurvey.revisions[1].controls[2].libraryIsInherited).toBe(true);
  });
  test('getPreparedLibraryResources works', () => {
    let librarySurvey = mockLibrarySurvey();
    let result = getPreparedLibraryResources(librarySurvey);
    expect(result.length).toBe(librarySurvey.resources.length);
  });
  test('getPreparedLibraryControls works', () => {
    let librarySurvey = mockLibrarySurvey();
    let result = getPreparedLibraryControls(librarySurvey);
    expect(result.length).toBe(librarySurvey.revisions[librarySurvey.latestVersion - 1].controls.length);
  });
});
