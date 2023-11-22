import Vue from 'vue';

import _File from './File.vue';
import _Date from './Date.vue';
import FarmOsFarm from './FarmOsFarm.vue';
import FarmOsField from './FarmOsField.vue';
import FarmOsPlanting from './FarmOsPlanting.vue';
import Group from './Group.vue';
import Instructions from './Instructions.vue';
import Matrix from './matrix/Matrix.vue';
import MatrixCell from './matrix/MatrixCell.vue';
import _Number from './Number.vue';
import Ontology from './Ontology.vue';
import Page from './Page.vue';
import Script from './Script.vue';
import SelectMultiple from './SelectMultiple.vue';
import SelectSingle from './SelectSingle.vue';
import String from './String.vue';
import FarmosUuid from './FarmOsCreateUUID.vue';

Vue.component('AppControlFile', _File);
Vue.component('AppControlImage', _File);

Vue.component('AppControlDate', _Date);

Vue.component('AppControlFarmOsFarm', FarmOsFarm);

Vue.component('AppControlFarmOsField', FarmOsField);

Vue.component('AppControlFarmOsPlanting', FarmOsPlanting);

// import GeoJSON from './GeoJSON.vue';
const GeoJSON = () => import('./GeoJSON.vue');
Vue.component('AppControlGeoJSON', GeoJSON);

Vue.component('AppControlGroup', Group);

Vue.component('AppControlInstructions', Instructions);

// import InstructionsImageSplit from './InstructionsImageSplit.vue';
const InstructionsImageSplit = () => import('./InstructionsImageSplit.vue');
Vue.component('AppControlInstructionsImageSplit', InstructionsImageSplit);

// import Location from './Location.vue';
const Location = () => import('./Location.vue');
Vue.component('AppControlLocation', Location);

Vue.component('AppControlMatrix', Matrix);

Vue.component('AppControlMatrixCell', MatrixCell);

Vue.component('AppControlNumber', _Number);

Vue.component('AppControlOntology', Ontology);

Vue.component('AppControlPage', Page);

Vue.component('AppControlScript', Script);

Vue.component('AppControlSelectMultiple', SelectMultiple);

Vue.component('AppControlSelectSingle', SelectSingle);

Vue.component('AppControlString', String);

Vue.component('AppControlFarmOsUuid', FarmosUuid);
