import GroupList from '@/pages/groups/GroupList.vue';
import GroupEdit from '@/pages/groups/GroupEdit.vue';
import GroupDetail from '@/pages/groups/Group.vue';
import GroupFarmOS from '@/pages/groups/FarmOS.vue';
import GroupHylo from '@/pages/groups/Hylo.vue';
import GroupIntegrationEdit from '@/pages/integrations/GroupIntegrationEdit.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/groups',
    name: 'groups-list',
    components: getComponents(GroupList),
  },
  {
    path: '/groups/new',
    name: 'groups-new',
    components: getComponents(GroupEdit),
  },
  {
    path: '/groups/edit/:id',
    name: 'groups-edit',
    components: getComponents(GroupEdit),
  },
  {
    path: '/g/*',
    name: 'groups-by-path',
    components: getComponents(GroupDetail),
  },
  {
    path: '/group-manage/farmos/:id',
    name: 'farmos-group-manage',
    props: true,
    components: getComponents(GroupFarmOS),
  },
  {
    path: '/group-manage/hylo/:id',
    name: 'hylo-group-manage',
    props: true,
    components: getComponents(GroupHylo),
  },
  {
    path: '/group-integrations/new',
    name: 'group-integrations-new',
    components: getComponents(GroupIntegrationEdit),
  },
  {
    path: '/group-integrations/:id/edit',
    name: 'group-integrations-edit',
    components: getComponents(GroupIntegrationEdit),
  },
];
