import { Router } from 'express';

import authController from '../controllers/authController';
import groupController from '../controllers/groupController';
import surveyController from '../controllers/surveyController';
import submissionController from '../controllers/submissionController';
import userController from '../controllers/userController';
import debugController from '../controllers/debugController';

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

/** Debug */
router.get('/debug', catchErrors(debugController.getDefault));
router.get('/debug/authenticated', assertAuthenticated, catchErrors(debugController.getDefault));
router.get('/debug/throw-error', catchErrors(debugController.throwError));
router.post('/debug/create-dummy-submissions', catchErrors(debugController.createDummySubmissions));
router.post('/debug/tabularasa', catchErrors(debugController.tabulaRasa));

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
router.delete('/groups/:id', assertAuthenticated, catchErrors(groupController.deleteGroup));

/** Submissions */
router.get('/submissions', catchErrors(submissionController.getSubmissions));
router.get('/submissions/:id', catchErrors(submissionController.getSubmission));
router.post('/submissions', catchErrors(submissionController.createSubmission));
router.put('/submissions/:id', catchErrors(submissionController.updateSubmission));
router.delete('/submissions/:id', catchErrors(submissionController.deleteSubmission));

/** Surveys */
router.get('/surveys', catchErrors(surveyController.getSurveys));
router.get('/surveys/:id', catchErrors(surveyController.getSurvey));
router.post('/surveys', [assertNameNotEmpty], catchErrors(surveyController.createSurvey));
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
router.get('/users/:id', catchErrors(userController.getUser));
router.post('/users', catchErrors(userController.createUser));
router.put(
  '/users/:id',
  [assertIdsMatch, assertEntityExists({ collection: 'users' })],
  catchErrors(userController.updateUser)
);
router.delete('/users/:id', catchErrors(userController.deleteUser));

export default router;
