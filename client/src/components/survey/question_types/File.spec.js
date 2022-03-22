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
      value.forEach((key, index) => {
        const input = wrapper.find('[data-test-id="file_' + index + '"]');
        expect(input.vnode.children[0].children[0].children[0].text).toContain(
          key.substring(key.lastIndexOf('/') + 1, key.length)
        );
      });
    };

    test('displays single file name', () => rendersValue(['resources/62398a1e977e7a0001718ef6/test.jpg']));
    test('displays multiple file names', () =>
      rendersValue(['resources/62398a1e977e7a0001718ee6/test2.jpg', 'resources/62398a1e977e7a0001718fe6/test3.jpg']));
  });
});
