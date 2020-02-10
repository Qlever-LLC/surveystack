<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-2">
      <h3>{{title}}</h3>
      <v-text-field
        placeholder="Search..."
        v-model="q"
        class="mw-40 mx-2"
      />
      <v-btn
        color="primary"
        :to="{name: 'groups-new', query: {path: path}}"
      >New</v-btn>
    </div>

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
          <v-list-item-icon>
            <v-btn
              :to="{name: 'groups-edit', params: {id: group._id}}"
              text
            >
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
