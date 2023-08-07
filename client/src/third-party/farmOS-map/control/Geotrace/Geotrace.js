import Control from 'ol/control/Control';
import { CLASS_CONTROL, CLASS_UNSELECTABLE } from 'ol/css';
import EventType from 'ol/events/EventType';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import Geolocation from 'ol/Geolocation';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { DrawEvent } from 'ol/interaction/Draw';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import { inAndOut } from 'ol/easing';
import { unByKey } from 'ol/Observable';

import './Geotrace.css';

const SVG_MARKER_HEADING =
  '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><mask id="arc"><rect x="0" y="0" width="24" height="24" fill="white"/><circle cx="12" cy="16" r="8" fill="black" stroke="none"/></mask><polygon fill="blue" points="12 2, 18 12, 6 12" mask="url(#arc)"/><circle cx="12" cy="16" r="6" fill="blue" stroke="none"/></svg>';
const SVG_MARKER =
  '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><circle cx="12" cy="16" r="6" fill="blue" stroke="none"/></svg>';
const SVG_PLAY =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_5599)"><path d="M16.394 12.0001L10 7.73707V16.2631L16.394 12.0001ZM19.376 12.4161L8.777 19.4821C8.70171 19.5322 8.61423 19.5609 8.52389 19.5652C8.43355 19.5696 8.34373 19.5493 8.264 19.5066C8.18427 19.4639 8.1176 19.4004 8.07111 19.3228C8.02462 19.2452 8.00005 19.1565 8 19.0661V4.93407C8.00005 4.84363 8.02462 4.75489 8.07111 4.67731C8.1176 4.59973 8.18427 4.53622 8.264 4.49353C8.34373 4.45084 8.43355 4.43058 8.52389 4.4349C8.61423 4.43922 8.70171 4.46796 8.777 4.51807L19.376 11.5841C19.4445 11.6297 19.5006 11.6916 19.5395 11.7642C19.5783 11.8367 19.5986 11.9178 19.5986 12.0001C19.5986 12.0824 19.5783 12.1634 19.5395 12.236C19.5006 12.3085 19.4445 12.3704 19.376 12.4161Z" fill="green"/></g><defs><clipPath id="clip0_0_5599"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';
const SVG_STOP =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_5711)"><path d="M7 7V17H17V7H7ZM6 5H18C18.2652 5 18.5196 5.10536 18.7071 5.29289C18.8946 5.48043 19 5.73478 19 6V18C19 18.2652 18.8946 18.5196 18.7071 18.7071C18.5196 18.8946 18.2652 19 18 19H6C5.73478 19 5.48043 18.8946 5.29289 18.7071C5.10536 18.5196 5 18.2652 5 18V6C5 5.73478 5.10536 5.48043 5.29289 5.29289C5.48043 5.10536 5.73478 5 6 5Z" fill="green"/></g><defs><clipPath id="clip0_0_5711"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';
const SVG_SAVE =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_1883)"><path d="M7 19V13H17V19H19V7.828L16.172 5H5V19H7ZM4 3H17L21 7V20C21 20.2652 20.8946 20.5196 20.7071 20.7071C20.5196 20.8946 20.2652 21 20 21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3ZM9 15V19H15V15H9Z" fill="green"/></g><defs><clipPath id="clip0_0_1883"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';
const SVG_DISCARD =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_7055)"><path d="M17 6H22V8H20V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22H5C4.73478 22 4.48043 21.8946 4.29289 21.7071C4.10536 21.5196 4 21.2652 4 21V8H2V6H7V3C7 2.73478 7.10536 2.48043 7.29289 2.29289C7.48043 2.10536 7.73478 2 8 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V6ZM18 8H6V20H18V8ZM9 4V6H15V4H9Z" fill="green"/></g><defs><clipPath id="clip0_0_7055"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';

const STATE_READY = 'STATE_READY';
const STATE_PROGRESS = 'STATE_PROGRESS';
const STATE_DONE = 'STATE_DONE';

const styles = {
  active: new Style({
    stroke: new Stroke({
      width: 2,
      color: [255, 255, 51, 1],
    }),
  }),
  inactive: new Style({
    stroke: new Stroke({
      width: 0,
      color: [0, 0, 0, 0],
    }),
  }),
};

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-geotrace'] CSS class name.
 * @property {string} [label='Geotrace'] Text label to use for the button.
 * @property {string} [tooltip='Geotrace'] Text to use for the button tooltip.
 * @property {HTMLElement|string} [target] Specify a target if you want the
 * control to be rendered outside of the map's viewport.
 */

/**
 * @classdesc
 * OpenLayers Geotrace Control.
 *
 * @api
 */
class Geotrace extends Control {
  /**
   * @param {Options=} opts Geotrace options.
   */
  constructor(opts) {
    const options = opts || {};

    // Call the parent control constructor.
    super({
      element: document.createElement('div'),
      target: options.target,
    });

    // Define the class name.
    const className = options.className || 'ol-geotrace';

    // Define default button label and tooltip.
    const label =
      options.label ||
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_5295)"><path d="M4 15V8.5C4 7.30653 4.47411 6.16193 5.31802 5.31802C6.16193 4.47411 7.30653 4 8.5 4C9.69347 4 10.8381 4.47411 11.682 5.31802C12.5259 6.16193 13 7.30653 13 8.5V15.5C13 16.163 13.2634 16.7989 13.7322 17.2678C14.2011 17.7366 14.837 18 15.5 18C16.163 18 16.7989 17.7366 17.2678 17.2678C17.7366 16.7989 18 16.163 18 15.5V8.83C17.3325 8.59409 16.7699 8.1298 16.4116 7.51919C16.0534 6.90858 15.9225 6.19098 16.0422 5.49321C16.1619 4.79545 16.5244 4.16246 17.0656 3.70613C17.6069 3.2498 18.292 2.99951 19 2.99951C19.708 2.99951 20.3931 3.2498 20.9344 3.70613C21.4756 4.16246 21.8381 4.79545 21.9578 5.49321C22.0775 6.19098 21.9466 6.90858 21.5884 7.51919C21.2301 8.1298 20.6675 8.59409 20 8.83V15.5C20 16.6935 19.5259 17.8381 18.682 18.682C17.8381 19.5259 16.6935 20 15.5 20C14.3065 20 13.1619 19.5259 12.318 18.682C11.4741 17.8381 11 16.6935 11 15.5V8.5C11 7.83696 10.7366 7.20107 10.2678 6.73223C9.79893 6.26339 9.16304 6 8.5 6C7.83696 6 7.20107 6.26339 6.73223 6.73223C6.26339 7.20107 6 7.83696 6 8.5V15H9L5 20L1 15H4ZM19 7C19.2652 7 19.5196 6.89464 19.7071 6.70711C19.8946 6.51957 20 6.26522 20 6C20 5.73478 19.8946 5.48043 19.7071 5.29289C19.5196 5.10536 19.2652 5 19 5C18.7348 5 18.4804 5.10536 18.2929 5.29289C18.1054 5.48043 18 5.73478 18 6C18 6.26522 18.1054 6.51957 18.2929 6.70711C18.4804 6.89464 18.7348 7 19 7Z" fill="green"/></g><defs><clipPath id="clip0_0_5295"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';
    const tooltip = options.tooltip || 'Geotrace';

    // Create the geotrace button element.
    const button = document.createElement('button');
    button.innerHTML = label;
    button.title = tooltip;
    button.className = className;
    button.type = 'button';

    // Register a click event on the button.
    button.addEventListener(EventType.CLICK, this.handleClick.bind(this), false);

    // Add the button and CSS classes to the control element.
    this.element.className = `${className} ${CLASS_UNSELECTABLE} ${CLASS_CONTROL}`;
    this.element.appendChild(button);

    // Get the drawing layer from the options.
    this.layer = options.layer;

    // Save options
    const defaultOptions = {};
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  /**
   * Callback for the geolocate button click event.
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick(event) {
    event.preventDefault();

    // Determine if the control is active. Defaults to false on the first click.
    this.active = this.active || false;

    // Activate or deactivate the class.
    if (!this.active) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  /**
   * Activate the geolocate control.
   * @private
   */
  activate() {
    this.active = true;

    // Add the "active" class.
    this.element.classList.add('active');

    // Hide controls
    this.element.parentElement.classList.add('hidden');

    // Get the map.
    const map = this.getMap();

    // LineString to store the different geolocation positions.
    // This LineString is time aware (the M dimension).
    // The Z dimension is actually used to store the rotation (heading).
    this.history = this.history || new LineString([], 'XYZM');
    // Hold geolocation positions that is rendered actually.
    this.trace = this.trace || new LineString([], 'XYZM');
    this.traceFeature = this.traceFeature || new Feature({ type: 'trace', geometry: this.trace });
    this.traceFeature.setStyle(styles.inactive);

    // Added preview layer to render route
    this.geotraceLayer =
      this.geotraceLayer ||
      new VectorLayer({
        source: new VectorSource({
          features: [this.traceFeature],
        }),
      });

    this.previousM = 0;
    this.renderKey = this.geotraceLayer.on('postrender', this.moveFeatures.bind(this));
    map.addLayer(this.geotraceLayer);

    // Geolocation marker
    if (!this.marker) {
      const markerEl = document.createElement('div');
      markerEl.innerHTML = SVG_MARKER;
      this.marker = new Overlay({
        positioning: 'center-center',
        element: markerEl,
        stopEvent: false,
        autoPan: {
          margin: 20,
          animation: {
            duration: 1000,
            easing: inAndOut,
          },
        },
      });
    }
    map.addOverlay(this.marker);

    // Create a geolocation object.
    this.geolocation =
      this.geolocation ||
      new Geolocation({
        trackingOptions: {
          maximumAge: 3000,
          enableHighAccuracy: true,
          timeout: 600000,
        },
        projection: map.getView().getProjection(),
      });

    // Turn on geo tracking.
    this.setTracking(true);

    // Add live controls
    if (!this.stateElements) {
      const viewPort = map.getViewport();
      this.stateElements = document.createElement('div');
      this.stateElements.className = 'geotrace-ctrls-container';
      viewPort.appendChild(this.stateElements);
    }

    this.changeState(STATE_READY);
  }

  /**
   * Deactivate the geolocate control.
   * @private
   */
  deactivate() {
    this.active = false;

    // Remove the "active" class.
    this.element.classList.remove('active');

    // Remove live controls
    this.stateElements.replaceChildren([]);

    // Restore controls
    this.element.parentElement.classList.remove('hidden');

    // Turn off geo tracking.
    this.setTracking(false);

    // Clear features
    this.history.setCoordinates([], 'XYZM');
    this.trace.setCoordinates([], 'XYZM');

    // Stop updating features
    unByKey(this.renderKey);
    this.renderKey = null;

    // Remove layer
    this.getMap().removeLayer(this.geotraceLayer);

    // Remove marker
    this.getMap().removeOverlay(this.marker);
  }

  /**
   * Update the history of positions.
   * @private
   */
  updateFeatures() {
    const [x, y] = this.geolocation.getPosition();
    let heading = this.geolocation.getHeading() || 0;
    const speed = this.geolocation.getSpeed() || 0;
    const m = Date.now();

    // modulo for negative values
    function mod(n) {
      return ((n % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }

    const previous = this.history.getLastCoordinate();
    const [, , prevHeading] = previous || [];
    if (prevHeading) {
      let headingDiff = heading - mod(prevHeading);

      // force the rotation change to be less than 180°
      if (Math.abs(headingDiff) > Math.PI) {
        const sign = headingDiff >= 0 ? 1 : -1;
        headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
      }
      heading = prevHeading + headingDiff;
    }

    // Keep last 20 coordinates
    const newCoords = [...this.history.getCoordinates(), [x, y, heading, m]].slice(-20);
    this.history.setCoordinates(newCoords, 'XYZM');

    const len = newCoords.length;
    if (len >= 2) {
      this.deltaMean = (newCoords[len - 1][3] - newCoords[0][3]) / (len - 1);
    }

    if (heading && speed) {
      this.marker.element.firstElementChild.innerHTML = SVG_MARKER_HEADING;
    } else {
      this.marker.element.firstElementChild.innerHTML = SVG_MARKER;
    }

    // Trigger `postrender` to draw features smoothly.
    // Note: at least one coordinate should be in the this.trace to make `postrender` working.
    // If not, OL will optimize the empty layer, so, nothing will happened.
    if (this.trace.getCoordinates().length === 0) {
      this.updateView();
    }

    this.getMap().render();
  }

  /**
   * Draw the marker and LineString smoothly
   * @private
   */
  moveFeatures() {
    // Don't geo track if DONE
    if (this.state === STATE_DONE) {
      return;
    }

    const coords = this.nextPosition();
    if (coords) {
      // Update marker
      this.marker.setPosition(coords);
      this.marker.element.firstElementChild.style.rotate = coords[2] + 'rad';

      // Track the geolocation position
      this.trace.appendCoordinate(coords);

      this.getMap().getView().setCenter(coords);
      this.getMap().render();
    }
  }

  /**
   * Update the map view's center and zoom based on the geolocation.
   * @private
   */
  updateView() {
    const coords = this.nextPosition();
    if (coords) {
      this.marker.setPosition(coords);
      this.trace.setCoordinates([coords], 'XYZM');

      this.getMap().getView().setCenter(coords);
      this.getMap().getView().setZoom(18);
    }
  }

  /**
   * Get the next position from the history
   * @private
   */
  nextPosition() {
    // Use sampling period to get a smooth transition
    const m = Math.max(Date.now() - this.deltaMean * 1.5, this.previousM);
    this.previousM = m;

    // Interpolate position along positions LineString
    return this.history.getCoordinateAtM(m, true);
  }

  /**
   * Change the states and its UI
   * @private
   */
  changeState(state) {
    const ctrls = {
      STATE_READY: [
        {
          svg: SVG_PLAY,
          label: 'Start trace',
          action: this.actionStart.bind(this),
        },
      ],
      STATE_PROGRESS: [
        {
          svg: SVG_STOP,
          label: 'Stop trace and process the draft',
          action: this.actionStop.bind(this),
        },
      ],
      STATE_DONE: [
        {
          svg: SVG_SAVE,
          label: 'Save and embed the result to the Map',
          action: this.actionSave.bind(this),
        },
        {
          svg: SVG_DISCARD,
          label: 'Clear draft and restart',
          action: this.actionDiscard.bind(this),
        },
      ],
    }[state];

    if (!Array.isArray(ctrls)) {
      return;
    }

    this.state = state;
    this.stateElements.replaceChildren(
      ...ctrls.map((ctrl) => {
        const ctrlEl = document.createElement('div');
        ctrlEl.className = 'geotrace-ctrl ol-control';

        const button = document.createElement('button');
        button.innerHTML = ctrl.svg;
        button.title = ctrl.label;
        button.addEventListener('click', ctrl.action);

        ctrlEl.appendChild(button);
        return ctrlEl;
      })
    );
  }

  /**
   * Start action
   * @private
   */
  actionStart() {
    this.trace.setCoordinates([], 'XYZM');
    this.traceFeature.setStyle(styles.active);

    this.changeState(STATE_PROGRESS);
  }

  /**
   * Stop action
   * @private
   */
  actionStop() {
    // Turn off geo tracking.
    this.setTracking(false);

    // Hide marker
    this.marker.setPosition();

    // Zoom to trace
    this.getMap()
      .getView()
      .fit(this.trace, {
        duration: 1000,
        easing: inAndOut,
        padding: [32, 32, 32, 32],
      });

    this.changeState(STATE_DONE);
  }

  /**
   * Discard action
   * @private
   */
  actionDiscard() {
    // Clear features
    this.traceFeature.setStyle(styles.inactive);

    // Turn on geo tracking.
    this.setTracking(true);

    // Reset zoom
    this.getMap().getView().setZoom(18);

    this.changeState(STATE_READY);
  }

  /**
   * Save action
   * @private
   */
  actionSave() {
    const traceFeature = new Feature({
      geometry: new LineString(
        this.trace.getCoordinates().map(([x, y]) => [x, y]),
        'XY'
      ),
    });

    // Add tracked route (LineString) to the main draw layer
    this.layer.getSource().addFeature(traceFeature);

    // Trigger `featurechange` event to notify listeners
    const editCtrl = this.getMap()
      .getControls()
      .getArray()
      .find((ctrl) => ctrl.element.className.includes('ol-edit'));
    editCtrl.enableDraw('LineString');
    const [drawInteraction] = this.getMap().getInteractions().getArray().slice(-1);
    drawInteraction.dispatchEvent(new DrawEvent('drawend', traceFeature));
    editCtrl.disableAll();

    // Deactivate tracking
    this.deactivate();
  }

  /**
   * Start geolocation tracking
   * @private
   */
  setTracking(track) {
    if (track) {
      // The geolocation sampling period mean in ms
      this.deltaMean = 500;

      // Turn on geo tracking.
      this.geolocation.setTracking(true);

      // Register event listener
      this.trackingKey = this.geolocation.on('change', this.updateFeatures.bind(this));
    } else {
      // Turn off geo tracking.
      this.geolocation.setTracking(false);

      if (this.trackingKey)
        // Unregister event listener
        unByKey(this.trackingKey);
      this.trackingKey = null;
    }
  }
}

export default Geotrace;
