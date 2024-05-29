<template>
  <a-container>
    <a-card class="pa-8" color="background">
      <v-skeleton-loader type="card-avatar, actions" v-if="scriptIsLoading"/>
      <div v-else-if="errorLoadingScript || !entity" class="ma-10">
        <a-alert color="error">
          <v-icon class="mr-3">mdi-alert</v-icon>
          Error loading script, please check network connectivity and refresh.
        </a-alert>
      </div>
      <div v-else>
        <div class="d-flex justify-end">
          <router-link :to="{ name: 'group-scripts-edit', params: { id: $route.params.id, scriptId: entity._id } }">
            <a-btn color="primary"> <a-icon left>mdi-pencil</a-icon> Edit </a-btn>
          </router-link>
        </div>
        <h1>{{ entity.name }}</h1>
        <div class="text-secondary mb-2">{{ entity._id }}</div>
        <code-editor title="" class="code-editor" :readonly="true" :code="this.entity.content" />
      </div>
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import codeEditor from '@/components/ui/CodeEditor.vue';

// When lazy-loading, the code editor just keeps on growing and growing :/
// const codeEditor = defineAsyncComponent(() => import('@/components/ui/CodeEditor.vue'));

export default {
  components: {
    codeEditor,
  },
  data() {
    return {
      entity: null,
      errorLoadingScript: false,
      scriptIsLoading: false,
    };
  },
  async created() {
    try {
      this.scriptIsLoading = true;
      const { scriptId } = this.$route.params;
      const { data } = await api.get(`/scripts/${scriptId}`);
      this.entity = { ...this.entity, ...data };
    } catch (e) {
      console.log(e);
      this.errorLoadingScript = true;
    } finally {
      this.scriptIsLoading = false;
    }
  },
};
</script>

<style scoped lang="scss">
.code-editor {
  height: 72vh;
  margin-bottom: 15px;
}
</style>
