import { mount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import FileComp from './File.vue';
import { Blob } from 'buffer';
import store from '@/store';

/*
  TODO: We should be able to remove this mock and exercise the actual code in `db`,
  which is backed by `fake-indexeddb` during tests. Currently, errors are thrown
  when trying to save Blobs to idb. It should be possible to save Blobs to idb within
  tests once we upgrade the following dependencies:
    - jest to >=28
    - fake-indexeddb >=4
    - node >= 17
  This can be done once this MR is merged: https://gitlab.com/our-sci/software/surveystack/-/merge_requests/369
*/
jest.mock('../../../store/db');

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
      await wrapper.vm.addFile(fileToAdd, fileResourceKeys, false, ['text/plain']);
      expect(fileResourceKeys[0]).toContain('test_file.txt');
    });
    test('a file with an excluded type results in error message', async () => {
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: [] }));
      const fileToAdd = getMockFile('file1.txt');
      await expect(wrapper.vm.addFile(fileToAdd, fileResourceKeys, false, ['application/pdf'])).rejects.toThrow(
        'not allowed'
      );
    });
    test('two files result in two files if multiple files is allowed', async () => {
      //suppress console.warn regarding indexeddb missing: jest.spyOn(console, 'warn').mockImplementation(() => {});
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: [] }));
      const file1 = getMockFile('file1.txt');
      const file2 = getMockFile('file2.txt');
      await wrapper.vm.addFile(file1, fileResourceKeys, true, ['text/plain']);
      await wrapper.vm.addFile(file2, fileResourceKeys, true, ['text/plain']);
      expect(fileResourceKeys).toHaveLength(2);
      expect(fileResourceKeys[0]).toContain('file1.txt');
      expect(fileResourceKeys[1]).toContain('file2.txt');
    });
    test('two files result in one file (the newest) if multiple files is not allowed', async () => {
      //suppress console.warn regarding indexeddb missing: jest.spyOn(console, 'warn').mockImplementation(() => {});
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: [] }));
      const file1 = getMockFile('file1.txt');
      const file2 = getMockFile('file2.txt');
      await wrapper.vm.addFile(file1, fileResourceKeys, false, ['text/plain']);
      await wrapper.vm.addFile(file2, fileResourceKeys, false, ['text/plain']);
      expect(fileResourceKeys).toHaveLength(1);
      expect(fileResourceKeys[0]).toContain('file2.txt');
    });
  });
  describe('removing', () => {
    test('a file results in a value without that file', async () => {
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: fileResourceKeys }));
      const file1 = getMockFile('file1.txt');
      const file2 = getMockFile('file2.txt');
      const file3 = getMockFile('file3.txt');
      await wrapper.vm.addFile(file1, fileResourceKeys, true, ['text/plain']);
      await wrapper.vm.addFile(file2, fileResourceKeys, true, ['text/plain']);
      await wrapper.vm.addFile(file3, fileResourceKeys, true, ['text/plain']);
      expect(wrapper.vm.$options.propsData.value).toHaveLength(3);
      await wrapper.vm.remove(0);
      expect(wrapper.vm.$options.propsData.value).toHaveLength(2);
      await wrapper.vm.remove(1);
      expect(wrapper.vm.$options.propsData.value[0]).toContain('file2.txt');
    });
  });
  describe('editing file name', () => {
    test('results in a changed resource key', async () => {
      const fileResourceKeys = [];
      const wrapper = mount(FileComp, getMountOpts({ value: fileResourceKeys }));
      const file1 = getMockFile('file1.txt');
      await wrapper.vm.addFile(file1, fileResourceKeys, true, ['text/plain']);
      await wrapper.vm.editResourceName(fileResourceKeys[0], 0);
      wrapper.vm.editFileName = 'new-file-name.txt';
      await wrapper.vm.commitResourceName(fileResourceKeys[0], 0);
      expect(wrapper.vm.$options.propsData.value[0]).toContain('new-file-name.txt');
    });
  });
});
