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

export async function fetchSurveyWithResources(store, sid) {
  try {
    const s = await fetchSurvey({ id: sid });
    if (s.resources) {
      await store.dispatch('resources/fetchResources', s.resources, { root: true });
    }
    return s;
  } catch (error) {
    console.error(`Error fetching survey resources with id ${sid}:`, error);
    // Return something so that the promise is resolved and not rejected
    return null;
  }
}

export function useSurvey() {
  const store = useStore();
  const router = useRouter();
  const {
    rightToSubmitSurvey,
    rightToEdit,
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
        action: (s) =>
          createAction(s, rightToSubmitSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`),
        render: (s) => () => !isADraft(s) && !isArchived(s) && rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Start Survey as Member',
        icon: 'mdi-open-in-new',
        action: (s) => createAction(s, rightToSubmitSurvey, () => setSelectMember(s)),
        render: (s) => () =>
          isOnline &&
          isGroupAdmin(getActiveGroupId()) &&
          !isADraft(s) &&
          !isArchived(s) &&
          rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Copy Start Link',
        icon: 'mdi-content-copy',
        action: (s) =>
          createAction(s, rightToSubmitSurvey, () =>
            copyTextToClipboard(
              `${window.location.origin}/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`
            )
          ),
        render: (s) => () => !isADraft(s) && !isArchived(s) && rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Call for Responses',
        icon: 'mdi-bullhorn',
        action: (s) =>
          createAction(s, rightToCallForSubmissions, () => {
            stateComposable.showCallForResponses = true;
            stateComposable.selectedSurvey = s;
          }),
        render: (s) => () => isOnline && !isArchived(s) && rightToCallForSubmissions(s).allowed,
      },
      {
        title: 'Description',
        icon: 'mdi-book-open',
        action: (s) =>
          createAction(s, rightToView, () => {
            stateComposable.showDescription = true;
            stateComposable.selectedSurvey = s;
          }),
        render: (s) => () => isOnline && rightToView(s).allowed,
      },
      {
        title: 'Print Blank Survey',
        icon: 'mdi-printer',
        action: (s) => createAction(s, rightToSubmitSurvey, () => downloadPrintablePdf(s._id)),
        render: (s) => () => isOnline && !isADraft(s) && rightToSubmitSurvey(s).allowed,
      },
      // {
      //   title: 'View',
      //   icon: 'mdi-file-document',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // },
      {
        title: 'Edit',
        icon: 'mdi-pencil',
        action: (s) => createAction(s, rightToEdit, () => editSurvey(s)),
        render: (s) => () => isOnline && rightToEdit().allowed,
      },
      {
        title: 'View Results',
        icon: 'mdi-chart-bar',
        action: (s) =>
          createAction(s, rightToViewAnonymizedResults, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions`),
        render: (s) => () => isOnline && rightToViewAnonymizedResults().allowed,
      },
      // {
      //   title: 'Share',
      //   icon: 'mdi-share',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // }
      {
        title: 'Pin Survey',
        icon: 'mdi-pin',
        action: (s) => createAction(s, rightToTogglePin, () => togglePinInMenu(s)),
        render: (s) => () => {
          return computed(() => {
            const isPinned = isPending.value ? false : isSurveyPinned(getActiveGroupId(), s._id)(pinnedData.value);
            return isOnline && !isADraft(s) && !isArchived(s) && rightToEdit().allowed && !isPinned;
          });
        },
      },
      {
        title: 'Unpin Survey',
        icon: 'mdi-pin-outline',
        action: (s) => createAction(s, rightToTogglePin, () => togglePinInMenu(s)),
        render: (s) => () => {
          return computed(() => {
            const isPinned = isPending.value ? false : isSurveyPinned(getActiveGroupId(), s._id)(pinnedData.value);
            return isOnline && !isADraft(s) && !isArchived(s) && rightToEdit().allowed && isPinned;
          });
        },
      },
    ];
  }

  function isADraft(survey) {
    return survey.latestVersion === 1;
  }

  function isArchived(survey) {
    return survey.meta?.archived ? survey.meta.archived : false;
  }

  async function togglePinInMenu(s) {
    await togglePinSurvey(s);
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

    queryParams.append('groupId', groupId);
    queryParams.append('isLibrary', 'false');
    queryParams.append('skip', (page - 1) * limit);
    queryParams.append('limit', limit);
    queryParams.append('prioPinned', showArchived ? false : true);
    queryParams.append('showArchived', showArchived);

    try {
      const { data } = await api.get(`/surveys/list-page?${queryParams}`);

      if (data.pinned) {
        data.pinned.forEach((s) => {
          data.content.unshift(s);
        });
      }
      delete data.pinned;

      if (searchString) {
        const filterContent = data.content.sort((a, b) => a.name.localeCompare(b.name));
        data.content = filterContent;
      }
      return data;
    } catch (e) {
      // TODO: use cached data?
      console.log('Error fetching surveys:', e);
    }
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

  function editSurvey(s) {
    router.push({
      name: 'group-surveys-edit',
      params: { id: getActiveGroupId(), surveyId: s._id },
    });
  }

  return {
    stateComposable,
    message,
    getSurveys,
    togglePinSurvey,
    isADraft,
    getMenu,
  };
}
