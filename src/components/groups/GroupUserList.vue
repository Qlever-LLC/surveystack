<template>
  <div>
    <v-card>
      <v-card-title>Members</v-card-title>
      <v-card-text>
        <v-text-field
          label="Search"
          append-icon="mdi-magnify"
          v-model="q"
        />
        <v-list-item
          v-for="(user,i) in users"
          :key="`user-${i}`"
          two-line
          :to="`/users/${user._id}`"
        >
          <v-list-item-content>
            <v-list-item-title>{{user.name}}</v-list-item-title>
            <v-list-item-subtitle>{{user.email}}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-card-text>

    </v-card>

  </div>
</template>

<script>
export default {
  data() {
    return {
      q: '',
    };
  },
  props: {
    entities: {
      type: Array,
    },
  },
  computed: {
    users() {
      if (!this.q) {
        return this.entities;
      }
      return this.entities.filter((entity) => {
        if (entity.name.toLowerCase().indexOf(this.q.toLowerCase()) > -1) {
          return true;
        }

        if (entity.email.toLowerCase().startsWith(this.q.toLowerCase())) {
          return true;
        }
        return false;
      });
    },
  },
};
</script>
