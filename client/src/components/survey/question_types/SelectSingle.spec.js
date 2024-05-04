import userEvent from '@testing-library/user-event';
import SelectSingle, { getNextValue } from './SelectSingle.vue';
import { mountWithVuetify, renderWithVuetify } from '../../../../tests/renderWithVuetify';

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
    modelValue: opts.modelValue || null,
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
      modelValue: options.modelValue,
      index: 'data.multiple_choice_1',
    },
  };
}

describe('SelectSingle question', () => {
  it('selects option on user click', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithVuetify(SelectSingle, getMountOpts());
    const radio = getByRole('radio', { name: 'Dog' });
    expect(radio).not.toBeChecked();

    await user.click(radio);

    expect(radio).toBeChecked();
  });

  it('sets custom input value as array', async () => {
    const wrapper = mountWithVuetify(SelectSingle, getMountOpts({ allowCustomSelection: true }));
    const customInput = wrapper.find('[data-testid="custom-input"] input');
    customInput.setValue('custom input');
    expect(wrapper.emitted()['update:modelValue'][0][0]).toEqual(['custom input']);
  });

  it('sets active radio button based on value as array', () => {
    const { getByRole } = renderWithVuetify(SelectSingle, getMountOpts({ modelValue: ['dog'] }));
    const dogRadio = getByRole('radio', { name: 'Dog' });
    expect(dogRadio).toBeChecked();
  });

  it('when custom value is specified, sets custom selection radio button as active and populates text box with value', () => {
    const { getByRole } = renderWithVuetify(
      SelectSingle,
      getMountOpts({ modelValue: ['custom'], allowCustomSelection: true })
    );
    const customRadio = getByRole('radio', { name: 'other custom' });
    const customTextBox = getByRole('textbox');
  
    expect(customTextBox).toHaveValue('custom');
    expect(customRadio).toBeChecked();
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
