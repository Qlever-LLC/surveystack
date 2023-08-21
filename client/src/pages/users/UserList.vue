<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <v-btn to="/users/new" color="primary">ADD</v-btn>
    </div>

    <v-card>
      <div v-for="e in entities" :key="e._id">
        <v-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <v-list-item-title>{{ e.email }}</v-list-item-title>
            <v-list-item-subtitle>{{ e.name }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-btn v-if="false" :to="`/users/${e._id}/edit`" text>
              <a-icon>mdi-pencil</a-icon>
            </v-btn>
          </v-list-item-icon>
        </v-list-item>
        <v-divider />
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
