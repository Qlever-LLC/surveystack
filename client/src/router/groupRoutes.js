import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import MySubmissions from '@/pages/surveys/MySubmissions.vue';
import Browse from '@/pages/surveys/Browse.vue';
import ScriptList from '@/pages/scripts/ScriptList.vue';
import AppNavigationGlobal from '@/components/AppNavigationGlobal.vue';
import GroupList from '@/pages/groups/GroupList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';

const setActiveGroup = (to, from, next) => {
  //TODO set the active group by the path param
  //store.dispatch('memberships/setActiveGroup', groupId);
  next();
};

export default [
  {
    path: '/groups/:id',
    name: 'group',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
    },
  },
  {
    path: '/groups/:id/surveys',
    name: 'group-surveys',
    components: {
      header: AppHeader,
      navigation: AppNavigationGroup,
      main: Browse,
    },
  },
];
