import { cloneDeep } from 'lodash';
import * as hyloService from '../../services/hylo.service';
import * as farmOsService from '../../services/farmos.service';

const handleApiCompose = async (submissionEntities, user) => {
  submissionEntities = cloneDeep(submissionEntities);

  // HOTFIX: do hylo first because farmos handler remove all apiCompose outputs from the submission
  // TODO: solve this in a cleaner way. Create utility functions for apiCompose handlers
  let hyloResults;
  try {
    hyloResults = await Promise.all(
      submissionEntities.map(async ({ entity, prevEntity, survey }) => {
        const results = await hyloService.handle({
          submission: entity,
          prevSubmission: prevEntity,
          survey,
          user,
        });
        // Save the results of the Hylo handler in the submission
        const permanentResults = results.map((r) => r.permanent).filter(Boolean);
        entity.meta.permanentResults = [
          ...(Array.isArray(entity.meta.permanentResults) ? entity.meta.permanentResults : []),
          ...permanentResults,
        ];
        return results;
      })
    );
  } catch (error) {
    console.log('error handling hylo', error);
    throw {
      message: `error submitting to hylo ${error}`,
      hylo: error,
      logs: error.logs || [],
    };
  }

  let farmOsResults;
  try {
    farmOsResults = await Promise.all(
      submissionEntities.map(({ entity, survey }) =>
        farmOsService.handle({
          submission: entity,
          survey,
          user, //todo
        })
      )
    );
  } catch (error) {
    // TODO what should we do if something internal fails?
    // need to let the user somehow know
    console.log('error handling farmos', error);
    throw {
      message: `error submitting to farmos ${error}`,
      farmos: error.messages,
      logs: error.logs || [],
    };
  }

  return {
    results: {
      farmos: farmOsResults.flat(),
      hylo: hyloResults.flat(),
    },
    entities: submissionEntities,
  };
};

export default handleApiCompose;
