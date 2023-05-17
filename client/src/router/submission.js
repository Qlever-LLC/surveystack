import SubmissionList from '@/pages/submissions/List.vue';
import SubmissionDraft from '@/pages/submissions/drafts/Draft.vue';
import SubmissionDraftNavbar from '@/components/SubmissionDraftNavbar.vue';
import { getComponents } from './helper';

export default [
  {
    path: '/submissions',
    name: 'submissions',
    components: getComponents(SubmissionList),
  },
  {
    path: '/submissions/drafts/:id',
    name: 'submissions-drafts-detail',
    components: getComponents(SubmissionDraft, {
      navbar: SubmissionDraftNavbar,
    }),
  },
];
