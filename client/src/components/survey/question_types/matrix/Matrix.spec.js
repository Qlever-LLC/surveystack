import { range } from 'lodash';
import Matrix from './Matrix.vue';

describe('Matrix question', () => {
  describe('methods.getDropdownItems', () => {
    const run = ({
      options,
      numCols = 3,
      colIdx = 1,
      numRows = 5,
      rowIdx = 0,
      valuesInRows = [],
      mapComponent = null,
    }) => {
      const field = `val_${colIdx}`;
      // fake the necessary parts of the component
      let component = {
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
        resourcesMap: {
          [`res_${colIdx}`]: options,
        },
      };

      if (mapComponent) {
        component = mapComponent(component);
      }

      return Matrix.methods.getDropdownItems.call(component, field);
    };

    const item = (value, label = '') => ({ value, label: label || value });

    it('selects the correct resource', () => {
      const options = [item('value_1', 'label_1'), item('value_2', 'label_2')];
      const items = run({ options });
      expect(items).toMatchObject(options);
    });

    it('adds the custom values from the same column', () => {
      const options = [item('value_1', 'label_1'), item('value_2', 'label_2')];
      const valuesInRows = [[], ['custom_1', 'custom_2'], ['custom_3'], ['custom_2', 'custom_4'], []];
      const items = run({ options, valuesInRows, numRows: 12 });
      expect(items).toMatchObject([...options, item('custom_1'), item('custom_2'), item('custom_3'), item('custom_4')]);
    });

    it('return empty array for unknown resource', () => {
      const options = [item('value_1', 'label_1'), item('value_2', 'label_2')];
      // remove resources from the component
      const mapComponent = (component) => ({ ...component, resources: [], resourcesMap: {} });
      const items = run({ options, mapComponent });
      expect(items).toMatchObject([]);
    });
  });
});
