import { mount, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Number from './Number.vue';

const vuetify = new Vuetify();

function getMountOpts(opts = {}) {
  const defaults = {
    value: 0,
  };
  opts = { ...defaults, ...opts };
  return {
    propsData: {
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
      value: opts.value,
      index: 'data.dropdown_1',
    },
    vuetify,
  };
}

describe('Number question', () => {
  describe('rendering', () => {
    const rendersValue = (value) => {
      const wrapper = shallowMount(Number, getMountOpts({ value }));
      const input = wrapper.find('[data-test-id="input"]');
      expect(input.vm.value).toBe(value);
    };

    test('displays integer value', () => rendersValue(5));
    test('displays float value', () => rendersValue(4.2));
    test('displays negative value', () => rendersValue(-7));
  });

  describe('input validating', () => {
    const wrapper = shallowMount(Number, getMountOpts());
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
      test(`methods.isValidNumber(${JSON.stringify(value)}) = ${expected}`, async () => {
        expect(wrapper.vm.isValidNumber(value)).toBe(expected);
      })
    );
  });

  describe('events', () => {
    [
      ['', null],
      ['7', 7],
      ['-7.3', -7.3],
      ['-70-7', undefined],
      ['seven', undefined],
      ['7e+2', 7e2],
    ].forEach(([value, result]) => {
      test(`emits change(${JSON.stringify(result)}) when the input value is ${JSON.stringify(value)}`, () => {
        const wrapper = mount(Number, getMountOpts({ value: 0 }));
        const input = wrapper.find('[data-test-id="input"]');
        input.setValue(value);
        const { changed } = wrapper.emitted();
        if (result !== undefined) {
          expect(changed.pop()).toEqual([result]);
        } else {
          expect(changed).toEqual(result);
        }
      });
    });
  });
});
