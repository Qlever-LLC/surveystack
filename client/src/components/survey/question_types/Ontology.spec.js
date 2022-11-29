import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Ontology, { fetchSubmissions } from './Ontology.vue';
import { resourceLocations, resourceTypes } from '@/utils/resources';

const vuetify = new Vuetify();

const resources = [
  {
    id: 'resource-1',
    label: 'Dropdown Items 1',
    location: resourceLocations.EMBEDDED,
    name: 'dropdown_items_1',
    type: resourceTypes.ONTOLOGY_LIST,
    content: [
      {
        value: 'dog',
        label: 'Dog',
        id: '2',
        tags: '',
      },
      {
        value: 'cat',
        label: 'Cat',
        id: '3',
        tags: '',
      },
      {
        value: 'lizard',
        label: 'Lizard',
        id: '4',
        tags: '',
      },
    ],
  },
  {
    label: 'Survey Reference 2',
    name: 'survey_reference_2',
    id: 'resource-2',
    type: resourceTypes.SURVEY_REFERENCE,
    location: resourceLocations.REMOTE,
    content: {
      id: '60afbd3eac16af0001203bba',
      version: 3,
      path: 'data.checkboxes_1',
    },
  },
];

function getMountOpts(opts = {}) {
  const options = {
    allowCustomSelection: opts.allowCustomSelection || false,
    hasMultipleSelections: opts.hasMultipleSelections || false,
    value: opts.value || null,
    source: opts.source || 'resource-1',
  };
  return {
    propsData: {
      control: {
        hint: '',
        id: '5',
        label: 'Dropdown 1',
        name: 'dropdown_1',
        options: {
          allowCustomSelection: options.allowCustomSelection,
          hasMultipleSelections: options.hasMultipleSelections,
          source: options.source,
          type: 'ontology',
        },
      },
      resources: [...resources],
      value: options.value,
      index: 'data.dropdown_1',
    },
    vuetify,
  };
}

function mockApiGetCheckboxesSubmissions() {
  return {
    data: [
      {
        _id: '60bfc84cfc482000010a3099',
        data: {
          checkboxes_1: {
            value: ['cat'],
          },
        },
      },
      {
        _id: '60bfc41ae47e630001bbb41e',
        data: {
          checkboxes_1: {
            value: ['cat'],
          },
        },
      },
      {
        _id: '60afbdf7ac16af0001203bfd',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
      {
        _id: '60afbde7ac16af0001203bfc',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
      {
        _id: '60afbdd4ac16af0001203bfb',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
    ],
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      url: '/api/submissions?survey=60afbd3eac16af0001203bba&project={"data.checkboxes_1.value":1}',
      method: 'get',
      headers: {},
      baseURL: '/api',
    },
    request: {},
  };
}

describe('Ontology question', () => {
  describe('Ontology List source', () => {
    it('sets value as an array in single selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts());
      const dropDown = wrapper.find('[data-test-id="autocomplete"]');
      dropDown.vm.$emit('change', 'dog');
      expect(wrapper.emitted().changed[0][0]).toEqual(['dog']);
    });

    it('sets autocomplete input from value in single selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts({ value: ['dog'] }));
      const dropDown = wrapper.find('[data-test-id="autocomplete"]');
      expect(dropDown.vm.value).toBe('dog');
    });

    it('sets value as an array in single selection, custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts({ allowCustomSelection: true }));
      const dropDown = wrapper.find('[data-test-id="combobox"]');
      dropDown.vm.$emit('change', 'dog');
      expect(wrapper.emitted().changed[0][0]).toEqual(['dog']);
    });

    it('sets autocomplete input from value in single selection, custom mode', () => {
      const wrapper = shallowMount(
        Ontology,
        getMountOpts({
          value: ['custom'],
          allowCustomSelection: true,
        })
      );
      const dropDown = wrapper.find('[data-test-id="combobox"]');
      expect(dropDown.vm.value).toBe('custom');
    });

    it('sets value as an array in mutliple selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts({ hasMultipleSelections: true }));
      const dropDown = wrapper.find('[data-test-id="autocomplete"]');
      dropDown.vm.$emit('change', ['cat', 'dog']);
      expect(wrapper.emitted().changed[0][0]).toEqual(['cat', 'dog']);
    });

    it('sets autocomplete value from value in multiple selection, non-custom mode', () => {
      const wrapper = shallowMount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          value: ['cat', 'dog'],
        })
      );
      const dropDown = wrapper.find('[data-test-id="autocomplete"]');
      expect(dropDown.vm.value).toEqual(['cat', 'dog']);
    });

    it('sets autocomplete with chips from value in multiple selection, non-custom mode', () => {
      const wrapper = mount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          value: ['cat', 'dog'],
        })
      );
      expect(wrapper.findAll('.v-chip').wrappers.length).toBe(2);
    });

    it('sets value as an array in mutliple selection, custom mode', () => {
      const wrapper = shallowMount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
        })
      );
      const dropDown = wrapper.find('[data-test-id="combobox"]');
      dropDown.vm.$emit('change', ['custom', 'dog']);
      expect(wrapper.emitted().changed[0][0]).toEqual(['custom', 'dog']);
    });

    it('sets autocomplete value from value in multiple selection, custom mode', () => {
      const wrapper = shallowMount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
          value: ['custom', 'dog'],
        })
      );
      const dropDown = wrapper.find('[data-test-id="combobox"]');
      expect(dropDown.vm.value).toEqual(['custom', 'dog']);
    });

    it('sets autocomplete with chips from value in multiple selection, custom mode', () => {
      const wrapper = mount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
          value: ['custom', 'dog'],
        })
      );
      expect(wrapper.findAll('.v-chip').wrappers.length).toBe(2);
    });
  });

  describe('Survey Reference source', () => {
    it('fetchSubmissions handles items for checkboxes of strings', async () => {
      const mockApiService = { get: jest.fn(() => mockApiGetCheckboxesSubmissions()) };
      const items = await fetchSubmissions(mockApiService, 'my-survey-id', 'data.checkboxes_1');
      expect(items[0].label).toBe('cat');
      expect(items[0].count).toBe(5);
      expect(items[1].label).toBe('dog');
      expect(items[1].count).toBe(3);
    });
  });
});
