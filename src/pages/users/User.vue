<template>
  <v-container>
    <v-card>
      <v-card-title>{{entity.name}}</v-card-title>
      <v-card-subtitle>{{entity.email}}</v-card-subtitle>
      <v-card-text>{{entity._id}}</v-card-text>

    </v-card>
    <v-card class="mt-3">
      <v-card-title>Memberships</v-card-title>
      <v-list>
        <v-list-item
          v-for="(m,i) in entity.memberships"
          :key="`user-${entity._id}-memberships-${i}`"
          two-line
          :to="`/g/${m.groupDetail.path?m.groupDetail.path:''}${m.groupDetail.slug}`"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{m.groupDetail.name}}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{m.role}}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
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
        memberships: [],
      },
    };
  },
  async created() {
    const { id } = this.$route.params;
    const { data } = await api.get(`/users/${id}?populate=1`);
    this.entity = { ...this.entity, ...data };
  },
};
</script>
