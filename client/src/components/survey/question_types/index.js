import Vue from 'vue';

import _File from './File.vue';
Vue.component('AppControlFile', _File);
Vue.component('AppControlImage', _File);

import _Date from './Date.vue';
Vue.component('AppControlDate', _Date);

import FarmOsFarm from './FarmOsFarm.vue';
Vue.component('AppControlFarmOsFarm', FarmOsFarm);

import FarmOsField from './FarmOsField.vue';
Vue.component('AppControlFarmOsField', FarmOsField);

import FarmOsPlanting from './FarmOsPlanting.vue';
Vue.component('AppControlFarmOsPlanting', FarmOsPlanting);

// import GeoJSON from './GeoJSON.vue';
const GeoJSON = () => import('./GeoJSON.vue');
Vue.component('AppControlGeoJSON', GeoJSON);

import Group from './Group.vue';
Vue.component('AppControlGroup', Group);

import Instructions from './Instructions.vue';
Vue.component('AppControlInstructions', Instructions);

// import InstructionsImageSplit from './InstructionsImageSplit.vue';
const InstructionsImageSplit = () => import('./InstructionsImageSplit.vue');
Vue.component('AppControlInstructionsImageSplit', InstructionsImageSplit);

// import Location from './Location.vue';
const Location = () => import('./Location.vue');
Vue.component('AppControlLocation', Location);

import MatrixLegacy from './Matrix.legacy.vue';
Vue.component('AppControlMatrix.legacy', MatrixLegacy);

import Matrix from './matrix/Matrix.vue';
Vue.component('AppControlMatrix', Matrix);

import MatrixCell from './matrix/MatrixCell.vue';
Vue.component('AppControlMatrixCell', MatrixCell);

import _Number from './Number.vue';
Vue.component('AppControlNumber', _Number);

import Ontology from './Ontology.vue';
Vue.component('AppControlOntology', Ontology);

import Page from './Page.vue';
Vue.component('AppControlPage', Page);

import Script from './Script.vue';
Vue.component('AppControlScript', Script);

import SelectMultiple from './SelectMultiple.vue';
Vue.component('AppControlSelectMultiple', SelectMultiple);

import SelectSingle from './SelectSingle.vue';
Vue.component('AppControlSelectSingle', SelectSingle);

import String from './String.vue';
Vue.component('AppControlString', String);
