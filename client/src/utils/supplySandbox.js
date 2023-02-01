import dateFns from 'date-fns';
import * as utils from '@/utils/sandboxUtils';
import * as farmos from 'farmos';
import {
  requestFetchSubmissions,
  requestSetStatus,
  requestSetValue,
  requestSetContext,
  requestSetRenderQueue,
  requestLogMessage,
  requestRunSurveyStackKit,
  onMessage,
  handleLoaded,
  statusTypes,
  renderScript,
  runScript,
  resetDOM,
  // createUI,
} from '../../public/iframeMessaging.js';
import { createUI } from '../../public/iframeUI.js';
import * as ui from '../../public/iframeUI.js';

//TODO <link rel="stylesheet" href="/iframeStyles.css" />

export default {
  Date,
  JSON,
  Number,
  dateFns,
  utils,
  farmos,
  requestFetchSubmissions,
  requestSetStatus,
  requestSetValue,
  requestSetContext,
  requestSetRenderQueue,
  requestLogMessage,
  requestRunSurveyStackKit,
  onMessage,
  handleLoaded,
  statusTypes,
  renderScript,
  runScript,
  resetDOM,
  createUI,
  ui,
};
