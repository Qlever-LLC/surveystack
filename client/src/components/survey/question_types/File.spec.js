require('fake-indexeddb/auto');
import { mount, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import FileComp from './File.vue';
import { Blob } from 'buffer';
import store from '@/store';

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
    store: store,
  };
}

function getMockFile(fileName) {
  let content = 'test-data';
  let contentType = 'text/plain';

  let blob = new Blob([content], { type: contentType });
  blob['lastModifiedDate'] = '';
  blob['name'] = fileName;
  return blob;
}

describe('File question', () => {
  describe('rendering', () => {
    const rendersValue = (value) => {
      const wrapper = mount(FileComp, getMountOpts({ value }));
      value.forEach((key, index) => {
        const input = wrapper.find('[data-test-id="file_' + index + '"]');
        expect(input.vnode.data.domProps.textContent).toContain(key.substring(key.lastIndexOf('/') + 1, key.length));
      });
    };

    test('selected single file', () => rendersValue(['resources/62398a1e977e7a0001718ef6/test.jpg']));
    test('selected multiple files', () =>
      rendersValue(['resources/62398a1e977e7a0001718ee6/test2.jpg', 'resources/62398a1e977e7a0001718fe6/test3.jpg']));
  });
  describe('adding', () => {
    test('a file with an allowed type is added to value', async () => {
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: [] }));
      const fileToAdd = getMockFile('test_file.txt');
      await wrapper.vm.addFile(fileToAdd, fileResourceKeys, false, [
        { text: 'PDF (.pdf)', value: 'application/pdf' },
        { text: 'Spreadsheets (.csv)', value: 'text/csv' },
        { text: 'Image (.gif, .png, .jpg, .jpeg)', value: 'image/*' },
        { text: 'Plain text (.txt)', value: 'text/plain' },
      ]);
      expect(fileResourceKeys[0]).toContain('test_file.txt');
      //expect(wrapper.vm.$options.propsData.value).toContain(resource);
    });
    test.todo('two files results in two files if multiple files is allowed');
    test.todo('two files results in one file if multiple files is not allowed ');
    test.todo('a file with an excluded type results in error message');
  });
  describe('removing', () => {
    test.todo('a file results in a value without that file');
  });
  describe('editing file name', () => {
    test.todo('results in a changed name, label and key');
    test.todo('prevents special characters like /, *, #, <> etc');
  });
  describe('submitting', () => {
    test.todo('a submission with a file resource leads to a submission with a value containing a download url');
    test.todo('a submission with a file resource with missing file data prevents a submission to be submitted');
  });
});
