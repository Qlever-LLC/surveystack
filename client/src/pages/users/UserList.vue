<template>
  <a-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <a-btn to="/users/new" color="primary">ADD</a-btn>
    </div>

    <a-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/users/${e._id}`">
          <a-list-item-title>{{ e.email }}</a-list-item-title>
          <a-list-item-subtitle>{{ e.name }}</a-list-item-subtitle>
        </a-list-item>
        <a-divider />
      </div>
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      entities: [],
    };
  },
  async created() {
    const { data } = await api.get('/users');
    this.entities = data;
  },
};
</script>
