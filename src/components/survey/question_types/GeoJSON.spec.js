import { renderWithVuetify } from '../../../../tests/renderWithVuetify';
import GeoJSON, { 
  addBaseLayer, 
  getNextValue,
  addDrawingLayer,
} from './GeoJSON.vue';


import fs from 'fs';
import path from 'path';
import { mount } from '@vue/test-utils';

const cssFile = fs.readFileSync(
  path.resolve(__dirname, './GeoJSON.css'),
  'utf8'
);

const style = document.createElement('style');
style.setAttribute('type', 'text/css');
style.innerHTML = cssFile;

const getControlProps = (opts) => {
  const options = {
    showPolygon: true, 
    showLine: true,
    showPoint: true,
    showCircle: true,
    showMove: true,
    showModify: true,
    ...opts,
  }
  return {
    hint: 'hint',
    id: '1',
    label: 'label',
    moreInfo: 'more info',
    name: 'geojson_1',
    options: {
      geoJSON: {
        showPolygon: options.showPolygon,
        showLine: options.showLine,
        showPoint: options.showPoint,
        showCircle: options.showCircle,
        showMove: options.showMove,
        showModify: options.showModify,
      }
    },
    type: 'GeoJSON',
    value: null,
  };
}

describe('GeoJSON Question', () => {
  describe('hides controls', () => {
    let getByRole;
    let getByTitle;
    let getByText;
    let container;
    let updateProps;
    beforeEach(() => {
      const renderOptions = {
        propsData: {
          control: getControlProps(),
          value: null,
          index: 'data.geojson_1',
        },
      };
  
      ({ 
        getByTitle, 
        getByText, 
        getByRole, 
        container, 
        updateProps,
      } = renderWithVuetify(GeoJSON, renderOptions));
      container.append(style);
    })

    it('shows drawing controls by default', () => {
      expect(getByTitle('Draw a Polygon')).toBeVisible();
      expect(getByTitle('Draw a Line')).toBeVisible();
      expect(getByTitle('Draw a Point')).toBeVisible();
      expect(getByTitle('Draw a Circle')).toBeVisible();
      expect(getByTitle('Modify features')).toBeVisible();
      expect(getByTitle('Move features')).toBeVisible();

      getByText('hint');
      getByText('label');
      getByText('more info');
    });

    const thingsToTest = [
      {
        key: 'showPolygon',
        text: 'Draw a Polygon',
      },
      {
        key: 'showLine',
        text: 'Draw a Line',
      },
      {
        key: 'showPoint',
        text: 'Draw a Point',
      },
      {
        key: 'showCircle',
        text: 'Draw a Circle',
      },
      {
        key: 'showModify',
        text: 'Modify features',
      },
      {
        key: 'showMove',
        text: 'Move features',
      },
    ];

    thingsToTest.forEach(({key, text}) => {
      it(`hides ${text} control`, async () => {
        await updateProps({ 
          control: getControlProps({ [key]: false }),
        });
        expect(getByTitle(text)).not.toBeVisible();
      });
    });
   
  })

  // PSYCHE, probably not worth it to test
  // test event change handler and make sure that this.value gets updated

  // TODO: 
  // Extract out component logic into functions and export them
  // Import and test them
  // functions take map as arg to make testing easy

  describe('calls functions', () => {
    const featureCollection = { 
      type: 'FeatureCollection', 
      features: [
        { 
          type: 'Feature', 
          geometry: {
            type: 'Point',
            coordinates: [125.6, 10.1]
          },
        },
      ],
    };

    it('getNextValue returns null for empty feature collection', () => {
      expect(
        getNextValue({ type: 'FeatureCollection', features: []})
      ).toBeNull();
    });
    it('getNextValue returns geojson for non empty feature collection', () => {
      expect(getNextValue(featureCollection)).toBe(featureCollection);
    });

    it('addBaseLayer creates xyz layer', () => {
      const map = {
        addLayer: jest.fn(),
      };
      addBaseLayer(map);
      expect(map.addLayer).toHaveBeenCalled();
      expect(map.addLayer.mock.calls[0][0]).toBe('xyz');
      expect(map.addLayer.mock.calls[0][1].base).toBe(true);
    });

    it('adds drawing layer with empty value', () => {
      const map = {
        zoomToLayer: jest.fn(),
        addLayer: jest.fn(),
        addBehavior: jest.fn(),
      };
      addDrawingLayer(map);

      expect(map.addLayer).toHaveBeenCalled();
      expect(map.addLayer.mock.calls[0][0]).toBe('vector');
      expect(map.addLayer.mock.calls[0][1].geojson).toBe(undefined);
      expect(map.addBehavior).toHaveBeenCalled();
    });

    it('adds drawing layer with features from value', () => {
      const map = {
        zoomToLayer: jest.fn(),
        addLayer: jest.fn(),
        addBehavior: jest.fn(),
      };
      addDrawingLayer(map, featureCollection);

      expect(map.addLayer).toHaveBeenCalled();
      expect(map.addLayer.mock.calls[0][0]).toBe('vector');
      expect(map.addLayer.mock.calls[0][1].geojson).toBe(featureCollection);
      expect(map.addBehavior).toHaveBeenCalled();
    });
  });

  // describe('calls map change handler', () => {
  //   it('does thing', () => {
  //     const renderOptions = {
  //       propsData: {
  //         control: getControlProps(),
  //         value: null,
  //         index: 'data.geojson_1',
  //       },
  //     };
  
  //     const { 
  //       getByTitle, 
  //       getByText, 
  //       getByRole, 
  //       container, 
  //       debug,
  //       updateProps,
  //     } = renderWithVuetify(GeoJSON, renderOptions);

  //     const wrapper = mount(GeoJSON, renderOptions);
  //     console.log(wrapper.vm.map);
  //     console.log(wrapper.vm.edit);
  //     // wrapper.vm.map.dispatchEvent(new Event('drawend', {
  //     //   type: 'FeatureCollection',
  //     //   features: [],
  //     // }));
  //   });
  // })
});