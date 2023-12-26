import { mount, shallowMount } from '@vue/test-utils';
import SelectSingle, { getNextValue } from './SelectSingle.vue';
import { localVue } from '@/../tests/renderWithVuetify';

const selectSource = [
  {
    value: 'dog',
    label: 'Dog',
  },
  {
    value: 'cat',
    label: 'Cat',
  },
  {
    value: 'lizard',
    label: 'Lizard',
  },
];

function getMountOpts(opts = {}) {
  const options = {
    allowCustomSelection: opts.allowCustomSelection || false,
    value: opts.value || null,
  };
  return {
    props: {
      control: {
        hint: '',
        id: '1',
        label: 'Multiple Choice 1',
        name: 'multiple_choice_1',
        options: {
          allowCustomSelection: options.allowCustomSelection,
          source: selectSource,
          type: 'selectSingle',
        },
      },
      value: options.value,
      index: 'data.multiple_choice_1',
    },
    localVue,
  };
}

describe('SelectSingle question', () => {
  it('sets value as array', () => {
    const wrapper = mount(SelectSingle, getMountOpts());
    const radios = wrapper.findAll('[role="radio"]');
    radios[0].setChecked(); //TODO removed. Now part of setValue
    expect(wrapper.emitted().changed[0][0]).toEqual(['dog']);
  });

  it('sets custom input value as array', () => {
    const wrapper = mount(SelectSingle, getMountOpts({ allowCustomSelection: true }));
    const customInput = wrapper.find('[data-test-id="custom-input"]');
    customInput.setValue('custom input'); //TODO CHECK works for select, checkbox, radio button, input, textarea. Returns nextTick.
    // Apparently this doesn't matter?
    // await wrapper.vm.$nextTick();
    expect(wrapper.emitted().changed[0][0]).toEqual(['custom input']);
  });

  it('sets active radio button based on value as array', () => {
    const wrapper = shallowMount(SelectSingle, getMountOpts({ value: ['dog'] }));
    const radioGroup = wrapper.find('[data-test-id="radio-group"]');
    expect(radioGroup.vm.value).toBe('dog');
  });

  it('sets custom selection radio button as active for custom value', () => {
    const wrapper = shallowMount(
      SelectSingle,
      getMountOpts({
        value: ['custom'],
        allowCustomSelection: true,
      })
    );
    const customInputRadio = wrapper.find('[data-test-id="custom-input-radio"]');
    expect(customInputRadio.vm.value).toBe('custom');
  });

  it('sets custom selection text input for custom value', () => {
    const wrapper = mount(
      SelectSingle,
      getMountOpts({
        value: ['custom'],
        allowCustomSelection: true,
      })
    );
    const customInput = wrapper.find('[data-test-id="custom-input"]');
    expect(customInput.element.value).toBe('custom');
  });

  it('getNextValue returns array for string value', () => {
    expect(getNextValue('dog')).toEqual(['dog']);
  });

  it('getNextValue returns null for empty string', () => {
    expect(getNextValue('')).toBeNull();
  });

  it('getNextValue returns array for number', () => {
    expect(getNextValue(5)).toEqual([5]);
  });
});
