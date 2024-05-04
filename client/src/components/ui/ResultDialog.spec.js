import { fireEvent } from '@testing-library/vue';
import ResultDialog from './ResultDialog.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

// Skipped for now because the dialog is not being rendered.
// Potential directions to pursue:
// 1) use v-dialog's `attach` prop to specify the dom node to render in
// 2) use a full browser environment in tests, such as with playwright
describe.skip('ResultDialog', () => {
  it('displays basic data', async () => {
    const { getByText } = renderWithVuetify(ResultDialog, {
      props: {
        modelValue: true,
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
    it('emits close event', async () => {
      const { getByText, emitted } = renderWithVuetify(ResultDialog, {
        props: {
          modelValue: true,
        },
      });
      const button = getByText('Ok');
      await fireEvent.click(button);
      expect(emitted().close.length).toBe(1);
    });
  });
});
