<template>
  <v-container>
    <h1>{{ editMode ? "Edit script" : "Create script" }}</h1>
    <span class="text--secondary">{{this.entity._id}}</span>
    <v-form class="mt-3" @keydown.enter.prevent="submit">
      <v-text-field
        v-model="entity.name"
        label="Name"
        outlined
      />
      <code-editor
        title=""
        class="code-editor"
        :code="this.entity && this.entity.content"
        @keydown.enter.prevent="submit"
        @change="updateCode"
      />
      <!-- <v-textarea
        v-model="entity.content"
        label="Content"
        id="script-edit-content"
        outlined
        placeholder="This does not do anything for now..."
        :rows="15"
      /> -->
      <div class="d-flex mt-2 justify-end">

        <v-btn
          text
          @click="cancel"
        >Cancel</v-btn>
        <v-btn
          color="primary"
          @click="submit"
        >Submit</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import CodeEditor from '@/components/ui/CodeEditor.vue';

export default {
  data() {
    return {
      editMode: true,
      entity: {
        _id: '',
        name: '',
        content: '',
      },
    };
  },
  components: {
    CodeEditor,
  },
  methods: {
    cancel() {
      this.$router.replace({ name: 'scripts-list' });
    },
    updateCode(code) {
      this.entity.content = code;
    },
    async submit() {
      const data = this.entity;
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/scripts/${this.entity._id}` : '/scripts';

      if (this.entity.name.trim() === '') {
        console.log('Name must not be empty');
        return;
      }

      try {
        await api.customRequest({
          method,
          url,
          data,
        });

        if (!this.editMode) {
          this.$router.push('/scripts');
        }
      } catch (err) {
        console.log(err);
      }
    },
  },
  computed: {
    passwordHint() {
      if (this.editMode) {
        return 'Leave blank for no change';
      }
      return '';
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'scripts-new',
    );

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
