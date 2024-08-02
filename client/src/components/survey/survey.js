import { useStore } from 'vuex';
import { reactive, computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import api from '@/services/api.service';

import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';
import { useGroup } from '@/components/groups/group';

import { get } from 'lodash';
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';
import { useRouter } from 'vue-router';

export function useSurvey() {
  const store = useStore();
  const router = useRouter();
  const { mobile } = useDisplay();
  const { rightToSubmitSurvey, rightToEdit, rightToCallForSubmissions, rightToViewAnonymizedResults, rightToView } =
    getPermission();
  const { message, createAction } = menuAction();

  const { getActiveGroupId } = useGroup();

  const stateComposable = reactive({
    showSelectMember: false,
    selectedSurvey: undefined,
    showCallForResponses: false,
    showDescription: false,
    menu: [
      {
        title: 'Start Survey',
        icon: 'mdi-open-in-new',
        action: (s) =>
          createAction(s, rightToSubmitSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`),
        render: (s) => () => !isADraft(s) && rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Start Survey as Member',
        icon: 'mdi-open-in-new',
        action: (s) => createAction(s, rightToSubmitSurvey, () => setSelectMember(s)),
        render: (s) => () => !isADraft(s) && rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Call for Responses',
        icon: 'mdi-bullhorn',
        action: (s) =>
          createAction(s, rightToCallForSubmissions, () => {
            stateComposable.showCallForResponses = true;
            stateComposable.selectedSurvey = s;
          }),
        render: (s) => () => rightToCallForSubmissions(s).allowed,
      },
      {
        title: 'Description',
        icon: 'mdi-book-open',
        action: (s) =>
          createAction(s, rightToView, () => {
            stateComposable.showDescription = true;
            stateComposable.selectedSurvey = s;
          }),
        render: (s) => () => rightToView(s).allowed,
      },
      {
        title: 'Print Blank Survey',
        icon: 'mdi-printer',
        action: (s) => createAction(s, rightToSubmitSurvey, () => downloadPrintablePdf(s._id)),
        render: (s) => () => !isADraft(s) && rightToSubmitSurvey(s).allowed,
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
        render: (s) => () => rightToEdit().allowed,
      },
      {
        title: 'View Results',
        icon: 'mdi-chart-bar',
        action: (s) =>
          createAction(s, rightToViewAnonymizedResults, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions`),
        render: (s) => () => rightToViewAnonymizedResults().allowed,
      },
      // {
      //   title: 'Share',
      //   icon: 'mdi-share',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // }
      {
        title: 'Pin Survey',
        icon: 'mdi-pin',
        action: (s) => createAction(s, rightToEdit, () => tooglePinOnMobile(s)),
        render: (s) => () => mobile.value && !isADraft(s) && rightToEdit().allowed && !s.pinnedSurveys,
      },
      {
        title: 'Unpin Survey',
        icon: 'mdi-pin-outline',
        action: (s) => createAction(s, rightToEdit, () => tooglePinOnMobile(s)),
        render: (s) => () => mobile.value && !isADraft(s) && rightToEdit().allowed && s.pinnedSurveys,
      },
    ],
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

  function isADraft(survey) {
    return survey.latestVersion === 1;
  }

  const togglePinEvent = ref(undefined);
  function tooglePinOnMobile(s) {
    togglePinEvent.value = s;
  }

  async function tooglePinSurvey(survey) {
    const group = groups.value.find((g) => g._id === getActiveGroupId());
    const index = group.surveys.pinned.indexOf(survey._id);
    if (index > -1) {
      group.surveys.pinned.splice(index, 1);
      await store.dispatch('surveys/removePinned', survey);
    } else {
      group.surveys.pinned.push(survey._id);
      await store.dispatch('surveys/addPinned', survey);
    }

    await api.put(`/groups/${group._id}`, group);
  }

  async function getSurveys(groupId, searchString, page, limit, user = null) {
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
    queryParams.append('prioPinned', true);

    try {
      const { data } = await api.get(`/surveys/list-page?${queryParams}`);

      if (data.pinned) {
        data.pinned.forEach((s) => {
          s.pinnedSurveys = true;
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
      downloadExternal(data, disposition.parameters.filename);
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
    tooglePinSurvey,
    togglePinEvent,
    isADraft,
  };
}
