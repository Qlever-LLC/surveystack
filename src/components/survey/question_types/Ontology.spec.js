import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Ontology from './Ontology.vue';
import Vuetify from 'vuetify';

const vuetify = new Vuetify();

const resources = [
  {
    id: 'resource-1',
    label: 'Dropdown Items 1',
    location: 'EMBEDDED',
    name: 'dropdown_items_1',
    type: 'ONTOLOGY_LIST',
    content: [
      {
        value: "dog",
        label: "Dog",
        id: '2',
        tags: '',
      }, 
      {
        value: "cat",
        label: "Cat",
        id: '3',
        tags: '',
      }, 
      {
        value: "lizard",
        label: "Lizard",
        id: '4',
        tags: '',
      },
    ],
  },
];

function getMountOpts(opts = {}) {
  const options = {
    allowCustomSelection: opts.allowCustomSelection || false,
    hasMultipleSelections: opts.hasMultipleSelections || false,
    value: opts.value || null,
  }
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
          source: 'resource-1',
          type: 'ontology',
        },
      },
      resources,
      value: options.value,
      index: 'data.dropdown_1',
    },
    vuetify,
  };
}

describe('Ontology question', () => {
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
    const wrapper = shallowMount(Ontology, getMountOpts({ 
      value: ['custom'],
      allowCustomSelection: true,
    }));
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
    const wrapper = shallowMount(Ontology, getMountOpts({ 
      hasMultipleSelections: true,
      value: ['cat', 'dog'] 
    }));
    const dropDown = wrapper.find('[data-test-id="autocomplete"]');
    expect(dropDown.vm.value).toEqual(['cat', 'dog']);
  });

  it('sets autocomplete with chips from value in multiple selection, non-custom mode', () => {
    const wrapper = mount(Ontology, getMountOpts({ 
      hasMultipleSelections: true,
      value: ['cat', 'dog'] 
    }));
    expect(wrapper.findAll('.v-chip').wrappers.length).toBe(2);
  });

  it('sets value as an array in mutliple selection, custom mode', () => {
    const wrapper = shallowMount(Ontology, getMountOpts({ 
      hasMultipleSelections: true, 
      allowCustomSelection: true,
    }));
    const dropDown = wrapper.find('[data-test-id="combobox"]');
    dropDown.vm.$emit('change', ['custom', 'dog']);
    expect(wrapper.emitted().changed[0][0]).toEqual(['custom', 'dog']);
  });

  it('sets autocomplete value from value in multiple selection, custom mode', () => {
    const wrapper = shallowMount(Ontology, getMountOpts({ 
      hasMultipleSelections: true,
      allowCustomSelection: true,
      value: ['custom', 'dog'] 
    }));
    const dropDown = wrapper.find('[data-test-id="combobox"]');
    expect(dropDown.vm.value).toEqual(['custom', 'dog']);
  });

  it('sets autocomplete with chips from value in multiple selection, custom mode', () => {
    const wrapper = mount(Ontology, getMountOpts({ 
      hasMultipleSelections: true,
      allowCustomSelection: true,
      value: ['custom', 'dog'] 
    }));
    expect(wrapper.findAll('.v-chip').wrappers.length).toBe(2);
  });
});
