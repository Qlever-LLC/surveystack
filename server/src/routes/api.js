import { Router } from 'express';
import debugController from '../controllers/debugController';
import authController from '../controllers/authController';
import groupController from '../controllers/groupController';
import surveyController from '../controllers/surveyController';
import submissionController from '../controllers/submissionController';
import { syncDraft } from '../controllers/submissionController.part.ts';
import userController from '../controllers/userController';
import * as scriptController from '../controllers/scriptController';
import rolesController from '../controllers/rolesController';
import * as farmosController from '../controllers/farmosController';
import * as hyloController from '../controllers/hyloController';
import membershipController from '../controllers/membershipController';
import infoController from '../controllers/infoController';
import resourceController from '../controllers/resourceController';
import groupIntegrationController from '../controllers/groupIntegrationController';
import membershipIntegrationController from '../controllers/membershipIntegrationController';
import { unleashProxyApp } from '../services/featureToggle.service';
import cfsController from '../controllers/cfsController';
import {
  assertAuthenticated,
  assertIsSuperAdmin,
  assertHasGroupAdminAccess,
  assertEntityExists,
  assertIdsMatch,
  assertNameNotEmpty,
  assertEntityRights,
  assertSubmissionRights,
  assertEntitiesExist,
  assertEntitiesRights,
  assertHasIds,
  validateBulkReassignRequestBody,
  checkFeatureToggledOn,
  assertIsAtLeastOnceOwner,
  assertIsOwnerOfInstance,
} from '../handlers/assertions';
import { catchErrors } from '../handlers/errorHandlers';
import { handleDelegates } from '../handlers/headerHandlers';
import submissionMigration from '../middleware/submissionMigration';

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
router.post('/auth/request-magic-link', catchErrors(authController.requestMagicLink));
router.get('/auth/enter-with-magic-link', catchErrors(authController.enterWithMagicLink));
router.get('/auth/invalidate-magic-link', catchErrors(authController.invalidateMagicLink));

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
router.post(
  '/submissions/:id/send-email',
  [assertAuthenticated, assertEntityExists({ collection: 'submissions' })],
  catchErrors(submissionController.sendPdfLink)
);
router.get(
  '/submissions/:id',
  [assertEntityExists({ collection: 'submissions' })],
  catchErrors(submissionController.getSubmission)
);
router.get(
  '/submissions/:id/pdf',
  [assertEntityExists({ collection: 'submissions' })],
  catchErrors(submissionController.getSubmissionPdf)
);
router.post('/submissions/pdf', catchErrors(submissionController.postSubmissionPdf));
router.post(
  '/submissions',
  [catchErrors(submissionMigration), assertSubmissionRights],
  catchErrors(handleDelegates(submissionController.createSubmission))
);
router.put(
  '/submissions/:id',
  [
    catchErrors(submissionMigration),
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
router.post(
  '/submissions/sync-draft',
  [checkFeatureToggledOn('feature_sync_drafts'), assertAuthenticated],
  catchErrors(syncDraft)
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
router.get('/surveys/pinned', catchErrors(surveyController.getPinned));
router.get('/surveys/:id', catchErrors(surveyController.getSurvey));
router.get('/surveys/:id/pdf', catchErrors(surveyController.getSurveyPdf));
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
router.get(
  '/surveys/cleanup/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'surveys' })],
  catchErrors(surveyController.getCleanupSurveyInfo)
);
router.post(
  '/surveys/cleanup/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'surveys' })],
  catchErrors(surveyController.cleanupSurvey)
);
router.delete(
  '/surveys/:id',
  [assertAuthenticated, assertEntityExists({ collection: 'surveys' })],
  catchErrors(surveyController.deleteSurvey)
);

/** Users */
router.get('/owner/:userId', catchErrors(userController.isUserOwner));
router.get(
  '/ownership/:userId',
  [assertAuthenticated, assertIsAtLeastOnceOwner],
  catchErrors(userController.getOwnership)
);

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
router.delete('/scripts/:id', [assertIsSuperAdmin], catchErrors(scriptController.deleteScript));

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
router.post(
  '/memberships/activate-by-admin',
  catchErrors(membershipController.activateMembershipByAdmin)
);
router.post('/memberships/confirmed', catchErrors(membershipController.createConfirmedMembership));
router.post('/memberships', catchErrors(membershipController.createMembership));
router.put(
  '/memberships/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'memberships' })],
  catchErrors(membershipController.updateMembership)
);
router.delete(
  '/memberships/:id',
  catchErrors(
    membershipController.deleteMembership(async (membership, origin) => {
      try {
        await farmosController.removeMembershipHook(membership, origin);
      } catch (error) {
        // log the error, but don't escalate as it is not critical
        console.log(error);
      }
    })
  )
);

router.post(
  '/memberships/join-group',
  [assertAuthenticated],
  catchErrors(membershipController.joinGroup)
);

/** Roles */
router.get('/roles', catchErrors(rolesController.getRoles));

/** farmos */
router.get('/farmos/farms', catchErrors(handleDelegates(farmosController.getFarmOSInstances)));
router.get('/farmos/assets', catchErrors(handleDelegates(farmosController.getAssets)));

router.post(
  '/farmos/available-add-user-to-instance',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.availableAddUserToInstance)
);
router.post(
  '/farmos/add-user-to-instance',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.addUserToInstance)
);
router.post(
  '/farmos/available-update-ownership',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.availableUpdateOwnership)
);
router.post(
  '/farmos/update-ownership',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.updateOwnership)
);
router.post(
  '/farmos/available-remove-instance-from-user',
  assertAuthenticated,
  catchErrors(farmosController.availableRemoveInstanceFromUser)
);
router.post(
  '/farmos/remove-instance-from-user',
  assertAuthenticated,
  catchErrors(farmosController.removeInstanceFromUser)
);
router.post(
  '/farmos/available-delete-instance-from-user',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.availableDeleteInstance)
);
router.post(
  '/farmos/delete-instance-from-user',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.deleteInstance)
);
router.post(
  '/farmos/available-remove-instance-from-group',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.availableRemoveInstanceFromGroup)
);
router.post(
  '/farmos/remove-instance-from-group',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.removeInstanceFromGroup)
);
router.post(
  '/farmos/available-remove-instance-from-other-user',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.availableRemoveInstanceFromOtherUser)
);
router.post(
  '/farmos/remove-instance-from-other-user',
  [assertAuthenticated, assertIsOwnerOfInstance],
  catchErrors(farmosController.removeInstanceFromOtherUser)
);

// TODO update test connection
// router.post('/farmos/test', [assertAuthenticated], catchErrors(farmosController.testConnection));
router.post('/farmos/callback', catchErrors(farmosController.webhookCallback));
router.post('/farmos/check-url', catchErrors(farmosController.checkUrl));
router.post(
  '/farmos/create-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminCreateFarmOsInstance)
);
router.get('/farmos/plans', [assertIsSuperAdmin], catchErrors(farmosController.getPlans));
router.post('/farmos/plans/create', [assertIsSuperAdmin], catchErrors(farmosController.createPlan));

router.post('/farmos/plans/delete', [assertIsSuperAdmin], catchErrors(farmosController.deletePlan));

router.get(
  '/farmos/all',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminGetAllInstances)
);
router.post(
  '/farmos/group-map-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminMapFarmosInstance)
);

router.post(
  '/farmos/group-unmap-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminUnMapFarmosInstance)
);

router.post(
  '/farmos/user-map-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminMapFarmosInstanceToUser)
);

router.post(
  '/farmos/user-unmap-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminUnMapFarmosInstanceFromUser)
);

router.post(
  '/farmos/unmap-instance',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminUnMapFarmosInstanceFromAll)
);

router.post(
  '/farmos/group-manage/enable',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminUpdateFarmOSAccess)
);

router.get(
  '/farmos/notes/all',
  [assertIsSuperAdmin],
  catchErrors(farmosController.superAdminGetAllNotes)
);

router.post(
  '/farmos/group-manage/add-notes',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.addNotes)
);

router.post(
  '/farmos/group-manage/add-sa-notes',
  [assertIsSuperAdmin],
  catchErrors(farmosController.addSuperAdminNotes)
);

router.post(
  '/farmos/group-manage/:groupId/updatePlans',
  [assertIsSuperAdmin],
  catchErrors(farmosController.updatePlansForGroup)
);

router.post(
  '/farmos/group-manage/:groupId/seats',
  [assertIsSuperAdmin],
  catchErrors(farmosController.updateSeats)
);

router.get(
  '/farmos/group-manage/:groupId/domain',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.getDomain)
);

router.get(
  '/farmos/group-manage/:groupId',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupAdminMinimumGetGroupInformation)
);

router.get(
  '/farmos/group-manage/:groupId/plans',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.getPlanForGroup)
);

router.post(
  '/farmos/group-manage/:groupId/mapUser',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.mapUser)
);

router.post(
  '/farmos/group-manage/get-owners-from-instances',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.getOwnersFromInstances)
);

router.post(
  '/farmos/group-manage/:groupId/update-groups-for-user',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.updateGroupsForUser)
);

router.post(
  '/farmos/group-manage/:groupId/get-admin-link',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.getAdminLink)
);

router.post(
  '/farmos/group-manage/:groupId/check-url',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupManageCheckUrl)
);

router.post(
  '/farmos/group-manage/:groupId/create-instance',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupManageCreateFarmOsInstance)
);

router.post(
  '/farmos/group-manage/:groupId/subgroup-join-coffee-shop',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupAdminAllowGroupsToJoinCoffeeshop)
);

router.post(
  '/farmos/group-manage/:groupId/subgroup-create-farmos-instances',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupAdminMinimumUpdateCreateFarmOSInstances)
);

router.post(
  '/farmos/group-manage/:groupId/enable-coffeeshop',
  [assertHasGroupAdminAccess],
  catchErrors(farmosController.groupAdminJoinCoffeeShop)
);

/** Hylo */
router.post(
  '/hylo/create-new-integrated-group',
  [assertHasGroupAdminAccess],
  catchErrors(hyloController.createNewIntegratedHyloGroup)
);

router.post(
  '/hylo/set-integrated-group',
  [assertHasGroupAdminAccess],
  catchErrors(hyloController.setIntegratedHyloGroup)
);

router.post(
  '/hylo/remove-group-integration',
  [assertHasGroupAdminAccess],
  catchErrors(hyloController.removeHyloGroupIntegration)
);

router.post(
  '/hylo/invite-member-to-hylo-group',
  catchErrors(hyloController.inviteMemberToHyloGroup)
);

router.get(
  '/hylo/integrated-group/:groupId',
  [],
  catchErrors(hyloController.getIntegratedHyloGroup)
);

router.get('/hylo/group', [], catchErrors(hyloController.getGroupBySlug));

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

router.get(
  '/resources/:id',
  [checkFeatureToggledOn('feature_resource')],
  catchErrors(resourceController.getResource)
);
router.post(
  '/resources/download-url',
  [checkFeatureToggledOn('feature_resource')],
  catchErrors(resourceController.getDownloadURL)
);
router.post(
  '/resources/upload-url',
  [checkFeatureToggledOn('feature_resource')],
  catchErrors(resourceController.getUploadURL)
);
router.put(
  '/resources/commit/:id',
  [checkFeatureToggledOn('feature_resource')],
  catchErrors(resourceController.commitResource)
);
router.delete(
  '/resources/:id',
  [checkFeatureToggledOn('feature_resource'), assertAuthenticated],
  catchErrors(resourceController.deleteResource)
);

// info
router.get('/info/ip', catchErrors(infoController.getIP));
router.get('/info/public-ip', catchErrors(infoController.getPublicIP));
router.get('/info/public-hostname', catchErrors(infoController.getPublicHostname));

router.use('/toggles', unleashProxyApp);

// default api
router.get('/', (req, res) => {
  return res.send('This is API version 1');
});

router.get('/status', (_, res) => {
  return res.status(200).send('OK');
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
