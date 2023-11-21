<template>
  <div>
    <v-card>
      <v-card-title>
        {{ title }}
        <v-spacer />
        <v-btn color="primary" class="ml-4" :to="{ name: 'groups-new', query: { dir: dir } }" text>New...</v-btn>
      </v-card-title>
      <v-card-text>
        <a-text-field label="Search" v-model="q" id="surveystack-group-list-search" append-icon="mdi-magnify" />
        <template v-if="entities.length > 0">
          <v-list-item v-for="group in groups" :key="group._id" two-line :to="`/g${group.path}`">
            <v-list-item-content>
              <v-list-item-title>{{ group.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ group.path }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
        <div v-else class="grey--text">No {{ title }} yet</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    entities: {
      type: Array,
    },
    title: {
      type: String,
      default: 'Groups',
    },
    dir: {
      type: String,
      default: '/',
    },
  },
  computed: {
    groups() {
      if (!this.q) {
        return this.entities;
      }

      return this.entities.filter((entity) => entity.name.toLowerCase().indexOf(this.q.toLowerCase()) > -1);
    },
  },
  data() {
    return {
      q: '',
    };
  },
};
</script>
