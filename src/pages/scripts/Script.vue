<template>
  <v-container v-if="entity">
    <span class="text--secondary">{{entity._id}}</span>
    <h1>{{entity.name}}</h1>
    <p>This is a good script</p>
    <code-editor
      title=""
      class="code-editor"
      readonly="true"
      :code="this.entity.content"
    />
    <router-link :to="{ name: 'scripts-edit', params: { id: entity._id }}">
      <v-btn color="primary">
        Edit
      </v-btn>
    </router-link>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

const codeEditor = () => import('@/components/ui/CodeEditor.vue');

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
