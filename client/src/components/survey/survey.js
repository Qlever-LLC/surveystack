import { useStore } from 'vuex';
import { reactive, computed } from 'vue';
import api from '@/services/api.service';

import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';
import { useGroup } from '@/components/groups/group';

import { get } from 'lodash';
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';

export function useSurvey() {
  const store = useStore();
  const { rightToSubmitSurvey, rightToEdit, rightToCallForSubmissions, rightToViewAnonymizedResults, rightToView } =
    getPermission();
  const { message, createAction } = menuAction();

  const { getActiveGroupId } = useGroup();

  const stateComposable = reactive({
    showSelectMember: false,
    selectedSurvey: undefined,
    renderCallForResponses: false,
    menu: [
      {
        title: 'Start Survey',
        icon: 'mdi-open-in-new',
        action: (s) =>
          createAction(s, rightToSubmitSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Start Survey as Member',
        icon: 'mdi-open-in-new',
        action: (s) => createAction(s, rightToSubmitSurvey, () => setSelectMember(s)),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Call for Responses',
        icon: 'mdi-bullhorn',
        action: (s) =>
          createAction(s, rightToCallForSubmissions, () => {
            stateComposable.renderCallForResponses = true;
            stateComposable.selectedSurvey = s;
          }),
        render: (s) => () => rightToCallForSubmissions(s).allowed,
      },
      {
        title: 'Description',
        icon: 'mdi-book-open',
        action: (s) => createAction(s, rightToView, `/groups/${getActiveGroupId()}/surveys/${s._id}/description`),
        render: (s) => () => rightToView(s).allowed,
      },
      {
        title: 'Print Blank Survey',
        icon: 'mdi-printer',
        action: (s) => createAction(s, rightToSubmitSurvey, () => downloadPrintablePdf(s._id)),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
      },
      // {
      //   title: 'View',
      //   icon: 'mdi-file-document',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // },
      {
        title: 'Edit',
        icon: 'mdi-pencil',
        action: (s) => createAction(s, rightToEdit, `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`),
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
    ],
  });

  const isWhitelabel = computed(() => {
    return store.getters['whitelabel/isWhitelabel'];
  });
  const whitelabelPartner = computed(() => {
    return store.getters['whitelabel/partner'];
  });

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

  return {
    stateComposable,
    message,
    getSurveys,
    downloadPrintablePdf,
  };
}
