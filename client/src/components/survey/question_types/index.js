import _File from './File.vue';
import _Date from './Date.vue';
import FarmOsFarm from './FarmOsFarm.vue';
import FarmOsField from './FarmOsField.vue';
import FarmOsPlanting from './FarmOsPlanting.vue';
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
import { defineAsyncComponent } from 'vue';

const GeoJSON = defineAsyncComponent(() => import('./GeoJSON.vue'));
const InstructionsImageSplit = defineAsyncComponent(() => import('./InstructionsImageSplit.vue'));
const Location = defineAsyncComponent(() => import('./Location.vue'));

export default function addQuestionTypesComponents(app) {
  app.component('AppControlFile', _File);

  app.component('AppControlImage', _File);

  app.component('AppControlDate', _Date);

  app.component('AppControlFarmOsFarm', FarmOsFarm);

  app.component('AppControlFarmOsField', FarmOsField);

  app.component('AppControlFarmOsPlanting', FarmOsPlanting);

  app.component('AppControlGeoJSON', GeoJSON);

  app.component('AppControlInstructions', Instructions);

  app.component('AppControlInstructionsImageSplit', InstructionsImageSplit);

  app.component('AppControlLocation', Location);

  app.component('AppControlMatrix', Matrix);

  app.component('AppControlMatrixCell', MatrixCell);

  app.component('AppControlNumber', _Number);

  app.component('AppControlOntology', Ontology);

  app.component('AppControlPage', Page);

  app.component('AppControlScript', Script);

  app.component('AppControlSelectMultiple', SelectMultiple);

  app.component('AppControlSelectSingle', SelectSingle);

  app.component('AppControlString', String);

  app.component('AppControlFarmOsUuid', FarmosUuid);
}
