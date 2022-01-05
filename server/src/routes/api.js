import { Router } from 'express';

import debugController from '../controllers/debugController';
import authController from '../controllers/authController';
import groupController from '../controllers/groupController';
import surveyController from '../controllers/surveyController';
import submissionController from '../controllers/submissionController';
import userController from '../controllers/userController';
import scriptController from '../controllers/scriptController';
import rolesController from '../controllers/rolesController';
import farmosController from '../controllers/farmosController';
import membershipController from '../controllers/membershipController';
import infoController from '../controllers/infoController';
import resourceController from '../controllers/resourceController';

import groupIntegrationController from '../controllers/groupIntegrationController';
import membershipIntegrationController from '../controllers/membershipIntegrationController';

import cfsController from '../controllers/cfsController';

import {
  assertAuthenticated,
  assertIsSuperAdmin,
  assertEntityExists,
  assertIdsMatch,
  assertNameNotEmpty,
  assertEntityRights,
  assertSubmissionRights,
  assertEntitiesExist,
  assertEntitiesRights,
  assertHasIds,
  validateBulkReassignRequestBody,
} from '../handlers/assertions';

import { catchErrors } from '../handlers/errorHandlers';

const router = Router();

/** API Debug Controller*/
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', catchErrors(debugController.getDefault));
  router.get('/debug/authenticated', assertAuthenticated, catchErrors(debugController.getDefault));
  router.get('/debug/throw-error', catchErrors(debugController.throwError));
  router.post(
    '/debug/create-dummy-submissions',
    catchErrors(debugController.createDummySubmissions)
  );
  router.post('/debug/tabularasa', catchErrors(debugController.tabulaRasa));
}

/** Auth */
router.post('/auth/register', catchErrors(authController.register));
router.post('/auth/login', catchErrors(authController.login));
router.post('/auth/send-password-reset-mail', catchErrors(authController.sendPasswordResetMail));
router.post('/auth/reset-password', catchErrors(authController.resetPassword));

/** Group */
router.get('/groups', catchErrors(groupController.getGroups));
router.get('/groups/by-path*', catchErrors(groupController.getGroupByPath));
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
router.post('/groups/add-doc-link', assertAuthenticated, catchErrors(groupController.addDocLink));
router.post(
  '/groups/remove-doc-link',
  assertAuthenticated,
  catchErrors(groupController.removeDocLink)
);
// router.delete('/groups/:id', assertAuthenticated, catchErrors(groupController.deleteGroup));

/** Submissions */
router.get('/submissions', catchErrors(submissionController.getSubmissions));
router.get('/submissions/page', catchErrors(submissionController.getSubmissionsPage));
router.get('/submissions/csv', catchErrors(submissionController.getSubmissionsCsv));
router.post(
  '/submissions/:id/archive',
  [assertAuthenticated, assertEntityExists({ collection: 'submissions' }), assertEntityRights],
  catchErrors(submissionController.archiveSubmissions)
);
router.post(
  '/submissions/bulk-archive',
  [assertHasIds, assertEntitiesExist({ collection: 'submissions' }), assertEntitiesRights],
  catchErrors(submissionController.archiveSubmissions)
);
router.post(
  '/submissions/:id/reassign',
  [assertEntityExists({ collection: 'submissions' }), assertEntityRights],
  catchErrors(submissionController.reassignSubmission)
);
router.post(
  '/submissions/bulk-reassign',
  [
    validateBulkReassignRequestBody,
    assertEntitiesExist({ collection: 'submissions' }),
    assertEntitiesRights,
  ],
  catchErrors(submissionController.bulkReassignSubmissions)
);
router.get(
  '/submissions/:id',
  [assertEntityExists({ collection: 'submissions' })],
  catchErrors(submissionController.getSubmission)
);
router.post(
  '/submissions',
  [assertSubmissionRights],
  catchErrors(submissionController.createSubmission)
);
router.put(
  '/submissions/:id',
  [
    assertAuthenticated,
    assertIdsMatch,
    assertEntityExists({ collection: 'submissions' }),
    assertSubmissionRights,
    assertEntityRights,
  ],
  catchErrors(submissionController.updateSubmission)
);
router.delete(
  '/submissions/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'submissions' }), assertEntityRights],
  catchErrors(submissionController.deleteSubmissions)
);
router.post(
  '/submissions/bulk-delete',
  [assertHasIds, assertEntitiesExist({ collection: 'submissions' }), assertEntitiesRights],
  catchErrors(submissionController.deleteSubmissions)
);

/** Surveys */
router.get('/surveys', catchErrors(surveyController.getSurveys));
router.get('/surveys/info', catchErrors(surveyController.getSurveyInfo));
router.get('/surveys/list-page', catchErrors(surveyController.getSurveyListPage));
router.get(
  '/surveys/list-library-consumers',
  [assertAuthenticated],
  catchErrors(surveyController.getSurveyLibraryConsumers)
);
router.get('/surveys/page', catchErrors(surveyController.getSurveyPage));
router.get('/surveys/:id', catchErrors(surveyController.getSurvey));
router.get('/surveys/check-for-updates/:id', catchErrors(surveyController.checkForLibraryUpdates));
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
router.get('/users', assertIsSuperAdmin, catchErrors(userController.getUsers));
router.get('/users/:id', catchErrors(userController.getUser));
router.post('/users', [assertNameNotEmpty], catchErrors(userController.createUser));
router.put(
  '/users/:id',
  [assertAuthenticated, assertIdsMatch, assertEntityExists({ collection: 'users' })],
  catchErrors(userController.updateUser)
);
router.delete(
  '/users/:id',
  [assertAuthenticated, assertIsSuperAdmin],
  catchErrors(userController.deleteUser)
);

/** Scripts */
router.get('/scripts', catchErrors(scriptController.getScripts));
router.get('/scripts/:id', catchErrors(scriptController.getScript));
router.post('/scripts', [assertAuthenticated], catchErrors(scriptController.createScript));
router.put(
  '/scripts/:id',
  [assertAuthenticated, assertIdsMatch, assertEntityExists({ collection: 'scripts' })],
  catchErrors(scriptController.updateScript)
);
router.delete('/scripts/:id', [assertAuthenticated], catchErrors(scriptController.deleteScript));

/** Memberships */
router.get('/memberships', catchErrors(membershipController.getMemberships));
router.get('/memberships/tree', catchErrors(membershipController.getTree));
router.get('/memberships/:id', catchErrors(membershipController.getMembership));
router.post(
  '/memberships/:id/resend',
  [assertEntityExists({ collection: 'memberships' })],
  catchErrors(membershipController.resendInvitation)
);
router.post('/memberships/activate', catchErrors(membershipController.activateMembership));
router.post('/memberships', catchErrors(membershipController.createMembership));
router.put(
  '/memberships/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'memberships' })],
  catchErrors(membershipController.updateMembership)
);
router.delete('/memberships/:id', catchErrors(membershipController.deleteMembership));
router.post(
  '/memberships/join-group',
  [assertAuthenticated],
  catchErrors(membershipController.joinGroup)
);

/** Roles */
router.get('/roles', catchErrors(rolesController.getRoles));

/** farmos */
router.get('/farmos/farms', catchErrors(farmosController.getFarms));
router.get('/farmos/fields', catchErrors(farmosController.getFields));
router.get('/farmos/assets', catchErrors(farmosController.getAssets));
router.get(
  '/farmos/integrations/:id/farms',
  [assertAuthenticated],
  catchErrors(farmosController.getIntegrationFarms)
);
router.post('/farmos/test', [assertAuthenticated], catchErrors(farmosController.testConnection));

router.get('/farmos/members-by-farm', catchErrors(farmosController.getMembersByFarmAndGroup));

router.post('/farmos/set-memberships', catchErrors(farmosController.setFarmMemberships));
router.post('/farmos/checkurl', catchErrors(farmosController.checkUrl));
router.post('/farmos/create-instance', catchErrors(farmosController.createFarmOsInstance));
router.post('/farmos/callback', catchErrors(farmosController.webhookCallback));
router.get('/farmos/areas/:aggregator/:farmurl', catchErrors(farmosController.getAreas));
router.post('/farmos/areas/:aggregator/:farmurl', catchErrors(farmosController.createField));

/** Integrations - Group */
router.get('/group-integrations', catchErrors(groupIntegrationController.getIntegrations));

router.get('/group-integrations/:id', catchErrors(groupIntegrationController.getIntegration));

router.post(
  '/group-integrations',
  [assertNameNotEmpty],
  catchErrors(groupIntegrationController.createIntegration)
);

router.put(
  '/group-integrations/:id',
  [assertNameNotEmpty, assertIdsMatch, assertEntityExists({ collection: 'integrations.groups' })],
  catchErrors(groupIntegrationController.updateIntegration)
);
router.delete(
  '/group-integrations/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'integrations.groups' })],
  catchErrors(groupIntegrationController.deleteIntegration)
);

/** Integrations - Membership */
router.get(
  '/membership-integrations',
  catchErrors(membershipIntegrationController.getIntegrations)
);
router.get(
  '/membership-integrations/:id',
  catchErrors(membershipIntegrationController.getIntegration)
);
router.post(
  '/membership-integrations',
  [assertNameNotEmpty],
  catchErrors(membershipIntegrationController.createIntegration)
);
router.put(
  '/membership-integrations/:id',
  [
    assertNameNotEmpty,
    assertIdsMatch,
    assertEntityExists({ collection: 'integrations.memberships' }),
  ],
  catchErrors(membershipIntegrationController.updateIntegration)
);
router.delete(
  '/membership-integrations/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'integrations.memberships' })],
  catchErrors(membershipIntegrationController.deleteIntegration)
);

// Call for submissions (CFS)
router.post('/call-for-submissions/send', [assertAuthenticated], catchErrors(cfsController.send));

// resources
router.get('/resources/:surveyId', catchErrors(resourceController.getResources));
router.get('/resources/download-url/:key', catchErrors(resourceController.getDownloadURL));
router.post('/resources/upload-url', [assertAuthenticated], catchErrors(resourceController.getUploadURL));
router.put('/resources/commit/:id',[assertAuthenticated], catchErrors(resourceController.commitResource));
router.delete(
  '/resources/:id',
  [assertAuthenticated],
  catchErrors(resourceController.deleteResource)
);


// info
router.get('/info/ip', catchErrors(infoController.getIP));
router.get('/info/public-ip', catchErrors(infoController.getPublicIP));
router.get('/info/public-hostname', catchErrors(infoController.getPublicHostname));

// default api
router.get('/', (req, res) => {
  return res.send('This is API version 1');
});

// 404 fallback
router.use((req, res) => {
  return res.status(404).send({
    message: 'API route not found',
    path: req.path,
    status: 404,
  });
});

export default router;
