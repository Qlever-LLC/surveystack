<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <a-btn to="/users/new" color="primary">ADD</a-btn>
    </div>

    <v-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <a-list-item-title>{{ e.email }}</a-list-item-title>
            <a-list-item-subtitle>{{ e.name }}</a-list-item-subtitle>
          </v-list-item-content>
          <a-list-item-icon>
            <a-btn v-if="false" :to="`/users/${e._id}/edit`" text>
              <a-icon>mdi-pencil</a-icon>
            </a-btn>
          </a-list-item-icon>
        </a-list-item>
        <a-divider />
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
