<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-2">
      <slot name="header">
        <h2 class="grey--text text--darken-3">{{title}}</h2>
      </slot>
      <v-btn
        color="primary"
        class="ml-4"
        :to="{name: 'groups-new', query: {path: path}}"
      >New...</v-btn>
    </div>
    <v-text-field
      label="Search"
      v-model="q"
      id="oursci-group-list-search"
      append-icon="mdi-magnify"
    />

    <v-card>
      <div
        v-for="group in groups"
        :key="group._id"
      >
        <v-list-item :to="`/groups/${group.path?group.path:''}${group.name}`">
          <v-list-item-content>
            <v-list-item-title>{{group.name}}</v-list-item-title>
            <v-list-item-subtitle>{{group._id}}</v-list-item-subtitle>
            <small>path={{group.path | showNull}}</small>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
      </div>
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
    path: {
      type: String,
      default: null,
    },
  },
  computed: {
    groups() {
      if (!this.q) {
        return this.entities;
      }

      return this.entities.filter(entity => entity.name.toLowerCase().indexOf(this.q) > -1);
    },
  },
  data() {
    return {
      q: '',
    };
  },
};
</script>
