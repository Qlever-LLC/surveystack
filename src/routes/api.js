import { Router } from 'express';

import authController from '../controllers/authController';
import groupController from '../controllers/groupController';
import surveyController from '../controllers/surveyController';
import submissionController from '../controllers/submissionController';
import userController from '../controllers/userController';
import scriptController from '../controllers/scriptController';
import debugController from '../controllers/debugController';
import rolesController from '../controllers/rolesController';
import farmosController from '../controllers/farmosController';
import integrationController from '../controllers/integrationController';
import membershipController from '../controllers/membershipController';

//import { authenticated } from '../handlers/checkPermissions';
import {
  assertAuthenticated,
  assertEntityExists,
  assertIdsMatch,
  assertNameNotEmpty,
} from '../handlers/assertions';

import { catchErrors } from '../handlers/errorHandlers';

const router = Router();

/** Auth */
router.post('/auth/register', catchErrors(authController.register));
router.post('/auth/login', catchErrors(authController.login));
router.post('/auth/send-password-reset-mail', catchErrors(authController.sendPasswordResetMail));
router.post('/auth/reset-password', catchErrors(authController.resetPassword));

/** Debug */
router.get('/debug', catchErrors(debugController.getDefault));
router.get('/debug/authenticated', assertAuthenticated, catchErrors(debugController.getDefault));
router.get('/debug/throw-error', catchErrors(debugController.throwError));
router.post('/debug/create-dummy-submissions', catchErrors(debugController.createDummySubmissions));
router.post('/debug/tabularasa', catchErrors(debugController.tabulaRasa));

/** Group */
router.get('/groups', catchErrors(groupController.getGroups));
router.get('/groups/by-path*', catchErrors(groupController.getGroupByPath));
//router.get('/groups/:id/users', catchErrors(groupController.getUsers));
router.get('/groups/:id', catchErrors(groupController.getGroupById));
router.post('/groups', assertAuthenticated, catchErrors(groupController.createGroup));
router.put(
  '/groups/:id',
  [
    assertAuthenticated,
    assertNameNotEmpty,
    assertIdsMatch,
    assertEntityExists({ collection: 'groups' }),
  ],
  catchErrors(groupController.updateGroup)
);
router.delete('/groups/:id', assertAuthenticated, catchErrors(groupController.deleteGroup));

/** Submissions */
router.get('/submissions', catchErrors(submissionController.getSubmissions));
router.get('/submissions/page', catchErrors(submissionController.getSubmissionsPage));
router.get('/submissions/:id', catchErrors(submissionController.getSubmission));
router.post('/submissions', catchErrors(submissionController.createSubmission));
router.put('/submissions/:id', catchErrors(submissionController.updateSubmission));
router.delete('/submissions/:id', catchErrors(submissionController.deleteSubmission));

/** Surveys */
router.get('/surveys', catchErrors(surveyController.getSurveys));
router.get('/surveys/page', catchErrors(surveyController.getSurveyPage));
router.get('/surveys/:id', catchErrors(surveyController.getSurvey));
router.post(
  '/surveys',
  [assertAuthenticated, assertNameNotEmpty],
  catchErrors(surveyController.createSurvey)
);
router.put(
  '/surveys/:id',
  [
    assertAuthenticated,
    assertNameNotEmpty,
    assertIdsMatch,
    assertEntityExists({ collection: 'surveys' }),
  ],
  catchErrors(surveyController.updateSurvey)
);
router.delete(
  '/surveys/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'surveys' })],
  catchErrors(surveyController.deleteSurvey)
);

/** Users */
router.get('/users', catchErrors(userController.getUsers));
//router.get('/users/by-group/:group', catchErrors(userController.getUsersByGroup));
router.get('/users/:id', catchErrors(userController.getUser));
router.post('/users', catchErrors(userController.createUser));
router.put(
  '/users/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'users' })],
  catchErrors(userController.updateUser)
);
router.delete('/users/:id', catchErrors(userController.deleteUser));

/** Scripts */
router.get('/scripts', catchErrors(scriptController.getScripts));
router.get('/scripts/:id', catchErrors(scriptController.getScript));
router.post('/scripts', catchErrors(scriptController.createScript));
router.put(
  '/scripts/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'scripts' })],
  catchErrors(scriptController.updateScript)
);
router.delete('/scripts/:id', catchErrors(scriptController.deleteScript));

/** Memberships */
router.get('/memberships', catchErrors(membershipController.getMemberships));
router.get('/memberships/:id', catchErrors(membershipController.getMembership));
router.post('/memberships', catchErrors(membershipController.createMembership));
router.put(
  '/memberships/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'memberships' })],
  catchErrors(membershipController.updateMembership)
);
router.delete('/memberships/:id', catchErrors(membershipController.deleteMembership));

/** Roles */
router.get('/roles', catchErrors(rolesController.getRoles));

/** farmos */
router.get('/farmos/fields', catchErrors(farmosController.getFields));
router.get('/farmos/assets', catchErrors(farmosController.getAssets));

/** Integrations */
router.get('/integrations', catchErrors(integrationController.getIntegrations));
router.get('/integrations/:id', catchErrors(integrationController.getIntegration));
router.post(
  '/integrations',
  [assertNameNotEmpty],
  catchErrors(integrationController.createIntegration)
);
router.put(
  '/integrations/:id',
  [assertNameNotEmpty, assertIdsMatch, assertEntityExists({ collection: 'integrations' })],
  catchErrors(integrationController.updateIntegration)
);
router.delete('/integrations/:id', catchErrors(integrationController.deleteIntegration));

export default router;
