import MembershipNew from '@/pages/memberships/MembershipNew.vue';
import MembershipEdit from '@/pages/memberships/MembershipEdit.vue';
import MembershipIntegrationEdit from '@/pages/integrations/MembershipIntegrationEdit.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/memberships/new',
    name: 'memberships-new',
    components: getComponents(MembershipNew),
  },
  {
    path: '/memberships/:id/edit',
    name: 'memberships-edit',
    components: getComponents(MembershipEdit),
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
];
