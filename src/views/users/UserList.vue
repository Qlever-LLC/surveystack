<template>
  <v-container>
    <h1>Browse Users</h1>
    <v-card>
      <div v-for="e in entities" :key="e._id">
        <v-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <v-list-item-title>{{e.email}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-btn :to="`/users/${e._id}/edit`" text>
              <v-icon>mdi-pencil</v-icon>
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

<style>
</style>
