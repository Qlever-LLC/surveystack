<template>
  <v-container v-if="entity">
    <span class="text--secondary">{{entity._id}}</span>
    <h1>{{entity.name}}</h1>
    <p>This is a good script</p>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
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
