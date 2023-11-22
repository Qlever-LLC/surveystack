<template>
  <v-container v-if="entity">
    <div class="d-flex justify-end">
      <router-link :to="{ name: 'scripts-edit', params: { id: entity._id } }">
        <v-btn color="primary"> <a-icon left>mdi-pencil</a-icon> Edit </v-btn>
      </router-link>
    </div>
    <h1>{{ entity.name }}</h1>
    <div class="text--secondary mb-2">{{ entity._id }}</div>

    <code-editor title="" class="code-editor" readonly="true" :code="this.entity.content" />
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import codeEditor from '@/components/ui/CodeEditor.vue';

// When lazy-loading, the code editor just keeps on growing and growing :/
// const codeEditor = () => import('@/components/ui/CodeEditor.vue');

export default {
  components: {
    codeEditor,
  },
  data() {
    return {
      entity: null,
    };
  },
  async created() {
    const { id } = this.$route.params;
    const { data } = await api.get(`/scripts/${id}`);
    this.entity = { ...this.entity, ...data };
  },
};
</script>

<style scoped>
.code-editor {
  height: 72vh;
  margin-bottom: 15px;
}
</style>
