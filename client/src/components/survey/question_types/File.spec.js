import { mount, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import FileComp from './File.vue';

const vuetify = new Vuetify();

function getMountOpts(opts = {}) {
  const defaults = {
    value: [new File(['data'], 'defaultfile.png')],
  };
  opts = { ...defaults, ...opts };
  return {
    propsData: {
      control: {
        hint: '',
        id: '6',
        label: 'File 1',
        name: 'file_1',
        options: {
          source: {
            allowMultiple: true,
            types: ['image/*', 'application/pdf'],
          },
        },
      },
      value: opts.value,
      index: 'data.file_1',
    },
    vuetify,
  };
}

describe('File question', () => {
  describe('rendering', () => {
    const rendersValue = (value) => {
      const wrapper = mount(FileComp, getMountOpts({ value }));
      value.forEach((file, index) => {
        const input = wrapper.find('[data-test-id="file_' + index + '"]');
        expect(input.vnode.children[0].children[0].text).toContain(file.name);
      });
    };

    test('displays single file name', () => rendersValue([new File(['data1'], 'file1.png')]));
    test('displays multiple file names', () =>
      rendersValue([new File(['data1'], 'file1.png'), new File(['data2'], 'file2.png')]));
  });
});
