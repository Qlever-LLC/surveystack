<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <a-btn to="/users/new" color="primary">ADD</a-btn>
    </div>

    <v-card>
      <div v-for="e in entities" :key="e._id">
        <v-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <v-list-item-title>{{ e.email }}</v-list-item-title>
            <v-list-item-subtitle>{{ e.name }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <a-btn v-if="false" :to="`/users/${e._id}/edit`" text>
              <v-icon>mdi-pencil</v-icon>
            </a-btn>
          </v-list-item-icon>
        </v-list-item>
        <v-divider />
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
