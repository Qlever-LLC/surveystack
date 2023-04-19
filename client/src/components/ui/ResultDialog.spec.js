import { fireEvent } from '@testing-library/vue';
import ResultDialog from './ResultDialog.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

describe('ResultDialog', () => {
  it('displays basic data', () => {
    const { getByText } = renderWithVuetify(ResultDialog, {
      propsData: {
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
      routes: [],
    });
    getByText('title');
    getByText('banana');
    getByText('fish');
    getByText('cleveland');
    getByText('wrecking yard');
    getByText('more text');
  });
  describe('close event', () => {
    it('emits close event', async () => {
      const { getByText, emitted } = renderWithVuetify(ResultDialog, {
        propsData: {
          value: true,
        },
        mocks: {
          $router: {
            push: jest.fn(),
          },
        },
        routes: [],
      });
      const button = getByText('Ok');
      await fireEvent.click(button);
      expect(emitted().close.length).toBe(1);
    });
  });
});
