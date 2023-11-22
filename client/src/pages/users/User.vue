<template>
  <v-container>
    <v-card>
      <v-card-text>
        <div class="overline">{{ user._id }}</div>
        <v-btn v-if="$store.getters['auth/isSuperAdmin']" outlined small :href="`/users/${user._id}/edit`"
          ><v-icon small>mdi-pencil</v-icon>Edit</v-btn
        >
        <p class="display-1 text--primary mt-2 mb-1">{{ user.name }}</p>
        <p class="subtitle-1">{{ user.email }}</p>
      </v-card-text>
    </v-card>
    <v-card v-if="memberships.length > 0" class="mt-3">
      <v-card-title>Memberships</v-card-title>
      <v-list>
        <a-list-item
          v-for="membership in memberships"
          :key="membership._id"
          :to="`/g${membership.group.path}`"
          three-line
        >
          <v-list-item-content>
            <span class="text--secondary caption">{{ membership.group.path }}</span>
            <a-list-item-title>{{ membership.group.name }}</a-list-item-title>
            <a-list-item-subtitle class="text--secondary">{{ membership.role }}</a-list-item-subtitle>
          </v-list-item-content>
        </a-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      user: {
        _id: '',
        email: '',
        name: '',
      },
      memberships: [],
    };
  },
  async created() {
    const { id } = this.$route.params;
    const { data: user } = await api.get(`/users/${id}`);
    this.user = { ...this.user, ...user };

    const { data: memberships } = await api.get(`/memberships?user=${id}&populate=1`);
    this.memberships = memberships;
  },
};
</script>

<style scoped>
.round-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}
</style>
