import MySubmissionsList from '@/pages/my-submissions/List.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/my-submissions',
    name: 'my-submissions-list',
    components: getComponents(MySubmissionsList),
  },
];
