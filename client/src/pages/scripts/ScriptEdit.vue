<template>
  <a-container>
    <h1>{{ editMode ? 'Edit script' : 'Create script' }}</h1>
    <span class="text--secondary">{{ this.entity._id }}</span>
    <a-form class="mt-3" @keydown.enter.prevent="submit">
      <a-text-field v-model="entity.name" label="Name" outlined hide-details />
      <active-group-selector
        class="my-4"
        label="Group"
        v-model="entity.meta.group"
        outlined
        returnObject
        adminGroupsOnly
      />
      <code-editor
        title=""
        class="code-editor"
        :code="this.entity && this.entity.content"
        @keydown.enter.prevent="submit"
        @change="updateCode"
      />
      <div class="d-flex mt-2 justify-end">
        <a-btn variant="text" @click="cancel">Cancel</a-btn>
        <a-btn color="primary" @click="submit">Save</a-btn>
      </div>
    </a-form>
  </a-container>
</template>

<script>
import ObjectId from 'bson-objectid';

import api from '@/services/api.service';
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';

import { SPEC_VERSION_SCRIPT } from '@/constants';

import codeEditor from '@/components/ui/CodeEditor.vue';

// When lazy-loading, the code editor just keeps on growing and growing :/
// const codeEditor = () => import('@/components/ui/CodeEditor.vue');

export default {
  data() {
    const now = new Date();
    return {
      editMode: true,
      entity: {
        _id: '',
        name: '',
        meta: {
          dateCreated: now,
          dateModified: now,
          revision: 1,
          creator: null,
          group: {
            id: null,
            path: null,
          },
          specVersion: SPEC_VERSION_SCRIPT,
        },
        content: `
/**
 * Process
 * @param {props} props
 * @param {submission} props.submission
 * @param {state} state
 */
export async function process(props, state) {
  const { submission, parent, control, params } = props;
  const { value, context } = state;

  // do stuff
  // ...

  return {
    context,
    value: null,
    status: {
      type: statusTypes.SUCCESS,
      message: \`script successfully executed at ${new Date().toISOString(true)}\`,
    },
  }
}

/**
 * render
 * @param {props} props
 * @param {state} state
 * @param {setState} setState
 */
export function render(props, state, setState) {
  const { submission, parent, control, params } = props;
  const { value, context } = state;
  const ui = createUI();

  ui.add(
      ui.text('Basic text'),
      ui.markdown(\`# Markdown Headline
-------
*italics*
**bold**
***bold italics***
~~strikethrough~~
[link]()
> Quote
- Unordered List
- List Item

1. Ordered List
2. List Item
    \`),

    ui.card('my card content', {
        header: 'Card',
        meta: 'meta',
        footer: 'footer',
    }),
    ui.message('Error', { type: 'error', header: 'Error' }),
    ui.message('Warning', { type: 'warning', header: 'Warning' }),
    ui.message('Plain', { header: 'Plain' }),
    ui.message('Plain'),
    ui.message('Info', { type: 'info', header: 'Info' }),
    ui.message('Success', { type: 'success', header: 'Success' }),
  );

  return ui.node;
};
        `,
      },
    };
  },
  components: {
    codeEditor,
    ActiveGroupSelector,
  },
  methods: {
    cancel() {
      this.$router.replace({ name: 'scripts-list' });
    },
    updateCode(code) {
      this.entity.content = code;
    },
    async submit() {
      if (this.entity.name.trim() === '') {
        console.log('Name must not be empty');
        return;
      }

      try {
        if (this.editMode) {
          await api.put(`/scripts/${this.entity._id}`, this.entity);
        } else {
          await api.post('/scripts', this.entity);
          this.$router.push('/scripts');
        }
      } catch (err) {
        console.log(err);
      }
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(({ name }) => name === 'scripts-new');

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/scripts/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>

<style scoped>
.code-editor {
  height: 77vh;
}
</style>
