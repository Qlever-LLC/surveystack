import { useStore } from 'vuex';
import { reactive, computed, isProxy } from 'vue';
import api from '@/services/api.service';
import emitter from '@/utils/eventBus';

import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';
import { useGroup } from '@/components/groups/group';

import { get } from 'lodash';
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { usePinned, isSurveyPinned } from '@/queries';
import copyTextToClipboard from '@/utils/copyToClipboard';
import { isPublished, isArchived } from '../../utils/surveys';

export const resolveRenderFunctionResult = (render, entity) => {
  let includeTypeFunction = false;
  if (typeof render === 'function') {
    includeTypeFunction = render(entity)();
  }

  const shouldInclude = render === undefined || includeTypeFunction;

  return isProxy(shouldInclude) ? shouldInclude.value : shouldInclude;
};

export async function fetchSurvey({ id, version = 'latest' }) {
  const { data: survey } = await api.get(`/surveys/${id}?version=${version}`);
  return survey;
}

export async function fetchSurveyWithResources(store, surveyId) {
  try {
    const survey = await fetchSurvey({ id: surveyId });
    if (survey.resources) {
      await store.dispatch('resources/fetchResources', survey.resources, { root: true });
    }
    return survey;
  } catch (error) {
    console.error(`Error fetching survey resources with id ${surveyId}:`, error);
    // Return something so that the promise is resolved and not rejected
    return null;
  }
}

export function useSurvey() {
  const store = useStore();
  const router = useRouter();
  const {
    rightToSubmitSurvey,
    rightToManageSurvey,
    rightToCallForSubmissions,
    rightToViewAnonymizedResults,
    rightToView,
    rightToTogglePin,
  } = getPermission();
  const { message, createAction } = menuAction();

  const { getActiveGroupId, isGroupAdmin } = useGroup();

  const queryClient = useQueryClient();
  const { data: pinnedData, isPending } = usePinned();

  const stateComposable = reactive({
    showSelectMember: false,
    selectedSurvey: undefined,
    showCallForResponses: false,
    showDescription: false,
  });

  const isWhitelabel = computed(() => {
    return store.getters['whitelabel/isWhitelabel'];
  });
  const whitelabelPartner = computed(() => {
    return store.getters['whitelabel/partner'];
  });
  const groups = computed(() => {
    return store.getters['memberships/groups'];
  });

  function getMenu(isOnline) {
    return [
      {
        title: 'Start Survey',
        icon: 'mdi-open-in-new',
        action: (survey) =>
          createAction(survey, rightToSubmitSurvey, `/groups/${survey.meta.group.id}/surveys/${survey._id}/submissions/new?submitTo={getActiveGroupId()}`),
        render: (survey) => () => isPublished(survey) && !isArchived(survey) && rightToSubmitSurvey(survey).allowed,
      },
      {
        title: 'Start Survey as Member',
        icon: 'mdi-open-in-new',
        action: (survey) => createAction(survey, rightToSubmitSurvey, () => setSelectMember(survey)),
        render: (survey) => () =>
          isOnline &&
          isGroupAdmin(getActiveGroupId()) &&
          isPublished(survey) &&
          !isArchived(survey) &&
          rightToSubmitSurvey(survey).allowed,
      },
      {
        title: 'Copy Survey Link',
        icon: 'mdi-link',
        action: (survey) =>
          createAction(survey, rightToSubmitSurvey, () =>
            copyTextToClipboard(
              `${window.location.origin}/groups/${survey.meta.group.id}/surveys/${survey._id}/submissions/new?submitTo=${getActiveGroupId()}`
            )
          ),
        render: (survey) => () => isPublished(survey) && !isArchived(survey) && rightToSubmitSurvey(survey).allowed,
      },
      {
        title: 'Call for Responses',
        icon: 'mdi-bullhorn',
        action: (survey) =>
          createAction(survey, rightToCallForSubmissions, () => {
            stateComposable.showCallForResponses = true;
            stateComposable.selectedSurvey = survey;
          }),
        render: (survey) => () => isOnline && !isArchived(survey) && rightToCallForSubmissions(survey).allowed,
      },
      {
        title: 'Description',
        icon: 'mdi-book-open',
        action: (survey) =>
          createAction(survey, rightToView, () => {
            stateComposable.showDescription = true;
            stateComposable.selectedSurvey = survey;
          }),
        render: (survey) => () => isOnline && rightToView(survey).allowed,
      },
      {
        title: 'Print Blank Survey',
        icon: 'mdi-printer',
        action: (survey) => createAction(survey, rightToSubmitSurvey, () => downloadPrintablePdf(survey._id)),
        render: (survey) => () => isOnline && isPublished(survey) && rightToSubmitSurvey(survey).allowed,
      },
      // {
      //   title: 'View',
      //   icon: 'mdi-file-document',
      //   action: (survey) => `/groups/${getActiveGroupId()}/surveys/${survey._id}`,
      // },
      {
        title: 'Edit',
        icon: 'mdi-pencil',
        action: (survey) => createAction(survey, rightToManageSurvey, () => editSurvey(survey)),
        render: (survey) => () => isOnline && rightToManageSurvey(survey).allowed,
      },
      {
        title: 'View Results',
        icon: 'mdi-chart-bar',
        action: (survey) =>
          createAction(survey, rightToViewAnonymizedResults, `/groups/${survey.meta.group.id}/surveys/${survey._id}/submissions`),
        render: (survey) => () => isOnline && rightToViewAnonymizedResults().allowed,
      },
      // {
      //   title: 'Share',
      //   icon: 'mdi-share',
      //   action: (survey) => `/groups/${getActiveGroupId()}/surveys/${survey._id}`,
      // }
      {
        title: 'Pin Survey',
        icon: 'mdi-pin',
        action: (survey) => createAction(survey, rightToTogglePin, () => togglePinInMenu(survey)),
        render: (survey) => () => {
          return computed(() => {
            const isPinned = isPending.value ? false : isSurveyPinned(getActiveGroupId(), survey._id)(pinnedData.value);
            return isOnline && isPublished(survey) && !isArchived(survey) && rightToTogglePin().allowed && !isPinned;
          });
        },
      },
      {
        title: 'Unpin Survey',
        icon: 'mdi-pin-outline',
        action: (survey) => createAction(survey, rightToTogglePin, () => togglePinInMenu(survey)),
        render: (survey) => () => {
          return computed(() => {
            const isPinned = isPending.value ? false : isSurveyPinned(getActiveGroupId(), survey._id)(pinnedData.value);
            return isOnline && isPublished(survey) && !isArchived(survey) && rightToTogglePin().allowed && isPinned;
          });
        },
      },
    ];
  }

  async function togglePinInMenu(survey) {
    await togglePinSurvey(survey);
    queryClient.invalidateQueries({ queryKey: ['pinnedSurveys'] });
    queryClient.invalidateQueries({ queryKey: ['pinnedSurveysGroup', getActiveGroupId()] });
    emitter.emit('togglePin');
  }

  async function togglePinSurvey(survey) {
    const group = groups.value.find((g) => g._id === getActiveGroupId());
    const index = group.surveys.pinned.indexOf(survey._id);
    if (index > -1) {
      group.surveys.pinned.splice(index, 1);
    } else {
      group.surveys.pinned.push(survey._id);
      await fetchSurveyWithResources(store, survey._id);
    }

    await api.put(`/groups/${group._id}`, group);
  }

  async function getSurveys(groupId, searchString, page, limit, showArchived, user = null) {
    const queryParams = new URLSearchParams();

    if (user) {
      queryParams.append('creator', user);
    }
    if (searchString) {
      queryParams.append('q', searchString);
    }
    if (isWhitelabel.value) {
      queryParams.append('prefix', whitelabelPartner.value.path);
    }

    queryParams.append('activeGroupId', groupId);
    queryParams.append('isLibrary', 'false');
    queryParams.append('skip', (page - 1) * limit);
    queryParams.append('limit', limit);
    queryParams.append('showArchived', showArchived);

    const { data } = await api.get(`/surveys/list-page?${queryParams}`);

    if (searchString) {
      const filterContent = data.content.sort((a, b) => a.name.localeCompare(b.name));
      data.content = filterContent;
    }
    return data;
  }

  function setSelectMember(survey) {
    stateComposable.showSelectMember = true;
    stateComposable.selectedSurvey = survey;
  }
  async function downloadPrintablePdf(survey) {
    try {
      const { headers, data } = await api.get(`/surveys/${survey}/pdf`);
      const disposition = parseDisposition(headers['content-disposition']);
      await downloadExternal(store, data, disposition.parameters.filename);
    } catch (e) {
      console.error('Failed to download printable PDF', e);
      store.dispatch(
        'feedback/add',
        get(
          e,
          'response.data.message',
          'Sorry, something went wrong while downloading a PDF of paper version. Try again later.'
        )
      );
    }
  }

  function editSurvey(survey) {
    router.push({
      name: 'group-surveys-edit',
      params: { id: survey.meta.group.id, surveyId: survey._id },
    });
  }

  return {
    stateComposable,
    message,
    getSurveys,
    togglePinSurvey,
    isPublished,
    getMenu,
  };
}
