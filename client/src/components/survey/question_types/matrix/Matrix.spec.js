import { range } from 'lodash';
import Matrix from './Matrix.vue';

describe('Matrix question', () => {
  describe('methods.getDropdownItems', () => {
    const run = ({ options, numCols = 3, colIdx = 1, numRows = 5, rowIdx = 0, valuesInRows = [] }) => {
      const field = `val_${colIdx}`;
      // fake the necessary parts of the component
      const component = {
        source: {
          content: range(numCols).map((i) => ({
            value: `val_${i}`,
            resource: `res_${i}`,
          })),
        },
        resources: [
          {
            id: `res_${colIdx}`,
            content: options,
          },
        ],
        rows: range(numRows).map((ri) => ({ [field]: { value: valuesInRows[ri] } })),
      };

      return Matrix.methods.getDropdownItems.call(component, field, valuesInRows[rowIdx]);
    };

    const item = (value, label = null) => ({ value, label: label === null ? value : label });

    it('selects the correct resource', () => {
      const options = [item('value_1', 'label_1'), item('value_2', 'label_2')];
      const items = run({ options });
      expect(items).toMatchObject(options);
    });

    it('adds the custom values from the same column', () => {
      const options = [item('value_1', 'label_1'), item('value_2', 'label_2')];
      const valuesInRows = [[], ['custom_1', 'custom_2'], ['custom_3'], ['custom_2', 'custom_4'], []];
      const items = run({ options, valuesInRows, numRows: 12 });
      expect(items).toMatchObject([item('custom_1'), item('custom_2'), item('custom_3'), item('custom_4'), ...options]);
    });

    it('sorts items alphabetically by the label', () => {
      const options = [item('zeta', 'beta'), item('theta'), item('delta'), item('alpha')];
      const items = run({ options });
      expect(items).toMatchObject([item('alpha'), item('zeta', 'beta'), item('delta'), item('theta')]);
    });

    it('sorts selected items to the top of the list', () => {
      const options = [item('beta'), item('theta'), item('delta'), item('alpha'), item('eta')];
      const items = run({ options, rowIdx: 0, valuesInRows: [['eta', 'delta']] });
      expect(items).toMatchObject([item('delta'), item('eta'), item('alpha'), item('beta'), item('theta')]);
    });
  });
});
