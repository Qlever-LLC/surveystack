<template>
  <v-card>
    <v-card-title>
      <slot name="title">
        {{title}}
      </slot>
      <v-spacer />
      <slot
        name="actions"
        v-if="editable"
      >
        <v-btn
          color="primary"
          class="ml-4"
          :to="linkNew"
          text
        >{{labelNew}}</v-btn>
      </slot>
    </v-card-title>
    <v-card-text>
      <v-text-field
        label="Search"
        v-model="q"
        append-icon="mdi-magnify"
      />
      <template v-if="entities.length > 0">
        <v-list-item
          v-for="(entity, idx) in filteredEntities"
          :key="idx"
          two-line
          :to="link(entity)"
        >
          <slot
            name="entity"
            v-bind:entity="entity"
          >
            <v-list-item-content>
              <v-list-item-title>Title #{{idx}}</v-list-item-title>
              <v-list-item-subtitle>Subtitle</v-list-item-subtitle>
            </v-list-item-content>
          </slot>
        </v-list-item>

      </template>
      <div
        v-else
        class="grey--text"
      >No {{title}} yet</div>
    </v-card-text>
  </v-card>

</template>

<script>
export default {
  props: {
    editable: {
      type: Boolean,
    },
    entities: {
      type: Array,
    },
    title: {
      type: String,
      default: 'Basic List',
    },
    searchable: {
      type: Boolean,
      default: true,
    },
    link: {
      type: Function,
      default(e) {
        return `/entity/${e._id}`;
      },
    },
    labelNew: {
      type: String,
      default: 'New...',
    },
    linkNew: {
      type: [String, Object],
    },
    filter: {
      type: Function,
    },
  },
  computed: {
    filteredEntities() {
      if (this.filter) {
        return this.filter(this.entities, this.q);
      }
      return this.defaultFilter();
    },

  },
  methods: {
    defaultFilter() {
      if (!this.q) {
        return this.entities;
      }
      return this.entities.filter(entity => entity.name.toLowerCase().indexOf(this.q.toLowerCase()) > -1);
    },
  },
  data() {
    return {
      q: '',
    };
  },
};
</script>
