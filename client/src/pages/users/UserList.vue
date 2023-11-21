<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h1>Browse Users</h1>

      <v-btn to="/users/new" color="primary">ADD</v-btn>
    </div>

    <v-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/users/${e._id}`">
          <v-list-item-content>
            <a-list-item-title>{{ e.email }}</a-list-item-title>
            <a-list-item-subtitle>{{ e.name }}</a-list-item-subtitle>
          </v-list-item-content>
          <a-list-item-icon>
            <v-btn v-if="false" :to="`/users/${e._id}/edit`" text>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </a-list-item-icon>
        </a-list-item>
        <a-divider />
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import AListItem from '@/components/ui/AListItem.vue';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemIcon from '@/components/ui/AListItemIcon.vue';
import AListItemSubtitle from '@/components/ui/AListItemSubtitle.vue';

export default {
  components: { AListItemSubtitle, AListItemIcon, AListItemTitle, AListItem },
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
