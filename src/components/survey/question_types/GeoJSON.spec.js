import { render } from '@testing-library/vue';
import Vuetify from 'vuetify';

const renderWithVuetify = function (component, options, callback) {
	const root = document.createElement('div');
	root.setAttribute('data-app', 'true');

	return render(
		component,
		{
			container: document.body.appendChild(root),
			// for Vuetify components that use the $vuetify instance property
			vuetify: new Vuetify(),
			...options,
		},
		callback
	);
};

export { renderWithVuetify };


import { fireEvent, waitFor, RenderResult } from '@testing-library/vue';
import GeoJSON from './GeoJSON.vue';

describe('GeoJSON Question', () => {
  it('loads', async () => {
    const { getByRole, getByText } = renderWithVuetify(
      GeoJSON, 
      {
        propsData: {
          control: {
            hint: '',
            id: '1',
            label: 'GeoJSON 1',
            name: 'geojson_1',
            options: {},
            type: 'GeoJSON',
            value: null,
          },
          value: null,
          index: 'data.geojson_1',
        },
      }
    );
    
    console.log()
  });

  // check if all drawing buttons appear
  // check if drawing buttons that are enabled via control settings exist and are visible

  // test event change handler and make sure that this.value gets updated
});