import Number, { isValidNumber } from '@/components/survey/question_types/Number.vue';
import { renderWithVuetify } from '../../../../tests/renderWithVuetify';

function getMountOpts(opts = {}) {
  const defaults = {
    value: 0,
  };
  opts = { ...defaults, ...opts };
  return {
    props: {
      control: {
        hint: '',
        id: '5',
        label: 'Number 1',
        name: 'number_1',
        options: {
          allowCustomSelection: false,
          hasMultipleSelections: false,
          source: null,
          type: 'number',
        },
      },
      modelValue: opts.value,
      index: 'data.dropdown_1',
    },
  };
}

describe('Number question', () => {
  describe('rendering', () => {
    const rendersValue = (value) => async () => {
      const { findByDisplayValue } = renderWithVuetify(Number, getMountOpts({ value }));
      await findByDisplayValue(value.toString());
    };

    test('displays integer value', rendersValue(5));
    test('displays float value', rendersValue(4.2));
    test('displays negative value', rendersValue(-7));
  });

  describe('input validating', () => {
    const errorMsg = 'Please enter a number';
    [
      ['', true],
      [null, true],
      ['6', true],
      ['-65', true],
      ['-6.5', true],
      ['-65-', errorMsg],
      ['-65.0.1', errorMsg],
      ['six', errorMsg],
      ['15e+3', true],
      [{}, errorMsg],
      [-6, true],
      [6.42, true],
    ].forEach(([value, expected]) =>
      test(`isValidNumber(${JSON.stringify(value)}) = ${expected}`, () => {
        expect(isValidNumber(value)).toBe(expected);
      })
    );
  });

  describe('events', () => {
    [
      ['', null],
      ['7', 7],
      ['-7.3', -7.3],
      ['7e+2', 7e2],
    ].forEach(([value, result]) => {
      test(`emits change(${JSON.stringify(result)}) when the input value is ${JSON.stringify(value)}`, () => {
        const changed = jest.fn();
        Number.methods.onInput.call({ changed }, value);
        expect(changed).toHaveBeenCalledWith(result);
      });
    });
  });
});
