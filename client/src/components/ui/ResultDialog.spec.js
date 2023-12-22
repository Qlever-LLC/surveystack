import { fireEvent } from '@testing-library/vue';
import ResultDialog from './ResultDialog.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

const noRoutes = [];

describe('ResultDialog', () => {
  it('displays basic data', () => {
    const { getByText } = renderWithVuetify(ResultDialog, {
      routes: noRoutes,
      props: {
        value: true,
        title: 'title',
        items: [
          {
            title: 'banana',
            body: 'fish',
          },
          {
            title: 'cleveland',
            body: 'wrecking yard',
          },
        ],
        additionalMessage: 'more text',
      },
    });
    getByText('title');
    getByText('banana');
    getByText('fish');
    getByText('cleveland');
    getByText('wrecking yard');
    getByText('more text');
  });
  describe('close event', () => {
    // TODO solve error mocks can't be used with VueRouter on localVue https://v1.test-utils.vuejs.org/guides/#using-with-vue-router
    it.skip('emits close event', async () => {
      const { getByText, emitted } = renderWithVuetify(ResultDialog, {
        props: {
          value: true,
        },
        global: {
          mocks: {
            $router: {
              push: jest.fn(),
            },
          },
        },
      });
      const button = getByText('Ok');
      await fireEvent.click(button);
      expect(emitted().close.length).toBe(1);
    });
  });
});
