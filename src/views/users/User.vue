<template>
  <v-container>
    <v-card>
      <v-card-title>{{entity.email}}</v-card-title>
      <v-card-subtitle>{{entity._id}}</v-card-subtitle>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      entity: {
        _id: '',
        email: '',
        name: '',
      },
    };
  },
  async created() {
    const { id } = this.$route.params;
    const { data } = await api.get(`/users/${id}`);
    this.entity = data;
  },
};
</script>
