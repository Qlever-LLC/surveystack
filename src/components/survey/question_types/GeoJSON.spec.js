import fs from 'fs';
import path from 'path';
import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../../tests/renderWithVuetify';
import GeoJSON, { addBaseLayer, getNextValue, addDrawingLayer } from './GeoJSON.vue';

import ControlProperties from '../../builder/ControlProperties.vue';
import { createControlInstance } from '../../../utils/surveyConfig';

const cssFile = fs.readFileSync(path.resolve(__dirname, './GeoJSON.css'), 'utf8');

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
  };
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
      },
    },
    type: 'GeoJSON',
    value: null,
  };
};

function mockFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [125.6, 10.1],
        },
      },
    ],
  };
}

function mockControl() {
  return {
    name: 'map_1',
    label: 'Map 1',
    type: 'geoJSON',
    options: {
      readOnly: false,
      required: false,
      redacted: false,
      relevance: {
        enabled: false,
        code: '',
      },
      constraint: {
        enabled: false,
        code: '',
      },
      calculate: {
        enabled: false,
        code: '',
      },
      apiCompose: {
        enabled: false,
        code: '',
      },
      geoJSON: {
        showPolygon: true,
        showLine: true,
        showCircle: true,
        showPoint: true,
      },
    },
    id: '60b524795575f00001f504dc',
    hint: '',
    value: null,
  };
}

function mockSurvey() {
  return {
    _id: '60b524715575f00001f504da',
    name: 'geojson',
    latestVersion: 2,
    meta: {
      dateCreated: '2021-05-31T18:01:21.662Z',
      dateModified: '2021-05-31T18:01:31.847Z',
      submissions: 'public',
      creator: '5e452119c5117c000185f275',
      group: {
        id: '5e6f8bbeea14550001470c28',
        path: '/our-sci/',
      },
      specVersion: 4,
    },
    resources: [],
    revisions: [
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 1,
        controls: [],
      },
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 2,
        controls: [
          {
            name: 'map_1',
            label: 'Map 1',
            type: 'geoJSON',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
              geoJSON: {
                showPolygon: true,
                showLine: true,
                showCircle: true,
                showPoint: true,
              },
            },
            id: '60b524795575f00001f504dc',
            hint: '',
            value: null,
          },
        ],
      },
    ],
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

      ({ getByTitle, getByText, getByRole, container, updateProps } = renderWithVuetify(GeoJSON, renderOptions));
      container.append(style);
    });

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
    ];

    thingsToTest.forEach(({ key, text }) => {
      it(`hides ${text} control`, async () => {
        await updateProps({
          control: getControlProps({ [key]: false }),
        });
        expect(getByTitle(text)).not.toBeVisible();
        expect(getByTitle('Modify features')).toBeVisible();
        expect(getByTitle('Move features')).toBeVisible();
      });
    });
  });

  describe('automatic initialization behavior', () => {
    it('activates geolocate control and geocoder has focus for null value', () => {
      const renderOptions = {
        propsData: {
          control: getControlProps(),
          value: null,
          index: 'data.geojson_1',
        },
      };

      const { getByTitle, getByText, getByRole, getByPlaceholderText, container, updateProps } = renderWithVuetify(
        GeoJSON,
        renderOptions
      );

      expect(getByTitle('Geolocate').parentElement.classList.contains('active')).toBe(true);
      // expect(input).toHaveFocus() doesn't seem to be working, even though element has focus in browser
      expect(getByPlaceholderText('Search for address...').parentElement.classList.contains('gcd-gl-expanded')).toBe(
        true
      );
    });

    it('does not activate geolocate control and geocoder is not expanded when value exists', () => {
      const renderOptions = {
        propsData: {
          control: getControlProps(),
          value: mockFeatureCollection(),
          index: 'data.geojson_1',
        },
      };

      const { getByTitle, getByText, getByRole, getByPlaceholderText, container, updateProps } = renderWithVuetify(
        GeoJSON,
        renderOptions
      );

      expect(getByTitle('Geolocate').parentElement.classList.contains('active')).toBe(false);
      // expect(input).toHaveFocus() doesn't seem to be working, even though element has focus in browser
      expect(getByPlaceholderText('Search for address...').parentElement.classList.contains('gcd-gl-expanded')).toBe(
        false
      );
    });
  });

  describe('utility functions', () => {
    const featureCollection = mockFeatureCollection();

    it('getNextValue returns null for empty feature collection', () => {
      expect(getNextValue(JSON.stringify({ type: 'FeatureCollection', features: [] }))).toBeNull();
    });
    it('getNextValue returns geojson for non empty feature collection', () => {
      expect(getNextValue(JSON.stringify(featureCollection))).toStrictEqual(featureCollection);
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
      expect(map.addLayer.mock.calls[0][1].geojson).toBe(JSON.stringify(featureCollection));
      expect(map.addBehavior).toHaveBeenCalled();
    });
  });

  describe('builder', () => {
    it('builder renders edit control toggles', async () => {
      const renderOptions = {
        propsData: {
          control: mockControl(),
          controls: [mockControl()],
          value: null,
          index: 'data.geojson_1',
          survey: mockSurvey(),
        },
      };
      const { getByText } = renderWithVuetify(ControlProperties, renderOptions);
      getByText('Show polygon control');
      getByText('Show line control');
      getByText('Show point control');
      getByText('Show circle control');
    });

    it('control toggles work', async () => {
      const control = mockControl();
      const renderOptions = {
        propsData: {
          control,
          controls: [mockControl()],
          value: null,
          index: 'data.geojson_1',
          survey: mockSurvey(),
        },
      };
      const { getByText } = renderWithVuetify(ControlProperties, renderOptions);
      const polygonControl = getByText('Show polygon control');
      const lineControl = getByText('Show line control');
      const pointControl = getByText('Show point control');
      const circleControl = getByText('Show circle control');
      fireEvent.click(polygonControl);
      fireEvent.click(lineControl);
      fireEvent.click(pointControl);
      await fireEvent.click(circleControl);
      expect(control.options.geoJSON).toEqual({
        showPolygon: false,
        showLine: false,
        showCircle: false,
        showPoint: false,
      });
    });

    it('creates question with correct default options', () => {
      expect(createControlInstance({ type: 'geoJSON' }).options.geoJSON).toEqual({
        showPolygon: true,
        showLine: true,
        showCircle: true,
        showPoint: true,
      });
    });
  });
});
