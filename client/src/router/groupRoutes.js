import AppHeader from '@/components/AppHeader.vue';
import AppNavigationGroup from '@/components/AppNavigationGroup.vue';
import Browse from '@/pages/surveys/Browse.vue';

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
