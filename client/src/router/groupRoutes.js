import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import MySubmissions from '@/pages/surveys/MySubmissions.vue';
import Browse from '@/pages/surveys/Browse.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import GroupList from '@/pages/groups/GroupList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';

export default [
  {
    path: '/g/:pathMatch(.*)',
    name: 'groups-by-path',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
    },
    beforeEnter: setActiveGroup,
  },
  {
    path: '/surveys/my-submissions',
    name: 'my-submissions',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: MySubmissions,
    },
  },
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Browse,
    },
  },
  {
    path: '/scripts',
    name: 'scripts-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: ScriptList,
    },
  },
  {
    path: '/groups/all',
    name: 'groups-list',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: GroupList,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    components: {
      header: AppHeader,
      navigation: AppNavigationGlobal,
      main: GroupEdit,
    },
    props: {
      header: {
        showLogo: true,
      },
    },
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: GroupEdit,
    },
  },
];

const setActiveGroup = (to, from, next) => {
  //TODO set the active group by the path param
  //store.dispatch('memberships/setActiveGroup', groupId);
  next();
};
