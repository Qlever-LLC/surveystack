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
      // {
      //   key: 'showModify',
      //   text: 'Modify features',
      // },
      // {
      //   key: 'showMove',
      //   text: 'Move features',
      // },
    ];

    thingsToTest.forEach(({key, text}) => {
      it(`hides ${text} control`, async () => {
        await updateProps({ 
          control: getControlProps({ [key]: false }),
        });
        expect(getByTitle(text)).not.toBeVisible();
        expect(getByTitle('Modify features')).toBeVisible();
        expect(getByTitle('Move features')).toBeVisible();
      });
    });
   
  })

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
        getNextValue(JSON.stringify({ type: 'FeatureCollection', features: []}))
      ).toBeNull();
    });
    it('getNextValue returns geojson for non empty feature collection', () => {
      expect(
        getNextValue(JSON.stringify(featureCollection))
      ).toStrictEqual(featureCollection);
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
      expect(map.addLayer.mock.calls[0][0]).toBe('geojson');
      expect(map.addLayer.mock.calls[0][1].geojson)
        .toBe(JSON.stringify(featureCollection));
      expect(map.addBehavior).toHaveBeenCalled();
    });
  });
});