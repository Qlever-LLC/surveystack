import { mount, shallowMount } from '@vue/test-utils';
import vuetify from '@/plugins/vuetify';
import Ontology from './Ontology.vue';
import { resourceLocations, resourceTypes } from '@/utils/resources';

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
    props: {
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
    global: {
      plugins: [vuetify],
    },
  };
}

describe('Ontology question', () => {
  describe('Ontology List source', () => {
    it('sets value as an array in single selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts());
      const dropDown = wrapper.find('a-select-stub');
      dropDown.vm.$emit('change', 'dog');
      expect(wrapper.emitted().changed[0][0]).toEqual(['dog']);
    });

    it('sets autocomplete input from value in single selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts({ value: ['dog'] }));
      const dropDown = wrapper.find('a-select-stub');
      expect(dropDown.vm.value).toBe('dog');
    });

    it('sets value as an array in single selection, custom mode', () => {
      const wrapper = mount(Ontology, getMountOpts({ allowCustomSelection: true }));
      const dropDown = wrapper.findComponent({ ref: 'dropdownRef' });

      //mock this.$refs.dropdownRef.blur();
      const blurMock = jest.fn();
      const dropdownRef = { blur: blurMock };
      wrapper.vm.$refs.dropdownRef = dropdownRef;

      dropDown.vm.$emit('change', 'dog');
      expect(wrapper.emitted().changed[0][0]).toEqual(['dog']);
    });

    it('sets autocomplete input from value in single selection, custom mode', () => {
      const wrapper = mount(
        Ontology,
        getMountOpts({
          value: ['custom'],
          allowCustomSelection: true,
        })
      );
      const dropDown = wrapper.findComponent({ ref: 'dropdownRef' });
      expect(dropDown.vm.value).toBe('custom');
    });

    it('sets value as an array in multiple selection, non-custom mode', () => {
      const wrapper = shallowMount(Ontology, getMountOpts({ hasMultipleSelections: true }));
      const dropDown = wrapper.find('a-select-stub');
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
      const dropDown = wrapper.find('a-select-stub');
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

    it('sets value as an array in multiple selection, custom mode', () => {
      const wrapper = mount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
        })
      );
      const dropDown = wrapper.findComponent({ ref: 'dropdownRef' });
      dropDown.vm.$emit('change', ['custom', 'dog']);
      expect(wrapper.emitted().changed[0][0]).toEqual(['custom', 'dog']);
    });

    it('sets autocomplete value from value in multiple selection, custom mode', () => {
      const wrapper = mount(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
          value: ['custom', 'dog'],
        })
      );
      const dropDown = wrapper.findComponent({ ref: 'dropdownRef' });
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
});
