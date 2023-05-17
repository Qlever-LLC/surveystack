import DraftList from '@/pages/drafts/List.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/drafts',
    name: 'drafts-list',
    components: getComponents(DraftList),
  },
];
