import AppHeader from '@/components/AppHeader.vue';
import ResourceList from '@/pages/resources/ResourceList.vue';
import GroupIntegrationEdit from '@/pages/integrations/GroupIntegrationEdit.vue';
import MembershipIntegrationEdit from '@/pages/integrations/MembershipIntegrationEdit.vue';

const commonComponents = {
  header: AppHeader,
};

function getComponents(component, mainComponents = commonComponents) {
  return {
    main: component,
    ...mainComponents,
  };
}

export default [
  // integrations
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
  {
    path: '/membership-integrations/new',
    name: 'membership-integrations-new',
    components: getComponents(MembershipIntegrationEdit),
  },
  {
    path: '/membership-integrations/:id/edit',
    name: 'membership-integrations-edit',
    components: getComponents(MembershipIntegrationEdit),
  },
  // Resources
  {
    path: '/resources',
    name: 'resources-list',
    components: getComponents(ResourceList),
  },
];
