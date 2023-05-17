import ScriptList from '@/pages/scripts/ScriptList.vue';
import ScriptEdit from '@/pages/scripts/ScriptEdit.vue';
import ScriptDetail from '@/pages/scripts/Script.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/scripts',
    name: 'scripts-list',
    components: getComponents(ScriptList),
  },
  {
    path: '/scripts/new',
    name: 'scripts-new',
    components: getComponents(ScriptEdit),
  },
  {
    path: '/scripts/:id/edit',
    name: 'scripts-edit',
    components: getComponents(ScriptEdit),
  },
  {
    path: '/scripts/:id',
    name: 'scripts-detail',
    components: getComponents(ScriptDetail),
  },
];
