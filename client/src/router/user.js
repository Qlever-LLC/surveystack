import UserList from '@/pages/users/UserList.vue';
import UserEdit from '@/pages/users/UserEdit.vue';
import UserDetail from '@/pages/users/User.vue';
import { getComponents, superGuard } from './helper';

export default [
  {
    path: '/users',
    name: 'users-list',
    components: getComponents(UserList),
    beforeEnter: superGuard,
  },
  {
    path: '/users/new',
    name: 'users-new',
    components: getComponents(UserEdit),
  },
  {
    path: '/users/:id/edit',
    name: 'users-edit',
    components: getComponents(UserEdit),
  },
  {
    path: '/users/:id',
    name: 'users-detail',
    components: getComponents(UserDetail),
  },
];
