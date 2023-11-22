<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <v-btn to="/users/new" color="primary">ADD</v-btn>
    </div>

    <a-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <a-list-item-title>{{ e.email }}</a-list-item-title>
            <a-list-item-subtitle>{{ e.name }}</a-list-item-subtitle>
          </v-list-item-content>
          <a-list-item-icon>
            <v-btn v-if="false" :to="`/users/${e._id}/edit`" text>
              <a-icon>mdi-pencil</a-icon>
            </v-btn>
          </a-list-item-icon>
        </a-list-item>
        <a-divider />
      </div>
    </a-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import ACard from '@/components/ui/ACard.vue';

export default {
  components: {
    ACard,
  },
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
