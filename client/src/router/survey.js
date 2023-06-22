import SurveyBrowse from '@/pages/surveys/Browse.vue';
import SurveyBuilder from '@/pages/builder/Builder.vue';
import SurveyDetail from '@/pages/surveys/Detail.vue';
import { getComponents, guard } from './helper';

export default [
  {
    path: '/surveys/browse',
    name: 'surveys-browse',
    components: getComponents(SurveyBrowse),
  },
  {
    path: '/surveys/new',
    name: 'surveys-new',
    components: getComponents(SurveyBuilder),
    props: {
      isNew: true,
    },
    beforeEnter: guard,
  },
  {
    path: '/surveys/:id',
    name: 'surveys-detail',
    components: getComponents(SurveyDetail),
  },
  {
    path: '/surveys/:id/start',
    name: 'surveys-start',
    components: getComponents(SurveyDetail),
    props: {
      default: {
        start: true,
      },
    },
  },
  {
    path: '/surveys/:id/edit',
    name: 'surveys-edit',
    components: getComponents(SurveyBuilder),
    props: {
      isNew: false,
    },
    beforeEnter: guard,
  },
];
