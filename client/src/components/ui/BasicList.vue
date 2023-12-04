<template>
  <a-card :loading="loading">
    <a-card-title class="heading--text">
      <slot name="title">
        {{ title }}
      </slot>
      <a-spacer />
      <slot name="actions" v-if="editable">
        <a-btn color="primary" class="ml-4" :to="linkNew" variant="text">{{ labelNew }}</a-btn>
      </slot>
    </a-card-title>
    <a-card-text>
      <a-text-field label="Search" v-model="q" append-icon="mdi-magnify" v-if="searchable" />
      <a-list
        v-if="entities.length > 0"
        :style="{
          'max-height': maxHeight || 'initial',
          'overflow-y': 'auto',
        }"
      >
        <div v-for="(entity, idx) in filteredEntities" :key="idx">
          <a-list-item two-line :to="link(entity)">
            <slot name="entity" v-bind:entity="entity">
              <v-list-item-content>
                <a-list-item-title>Title #{{ idx }}</a-list-item-title>
                <a-list-item-subtitle>Subtitle</a-list-item-subtitle>
              </v-list-item-content>
            </slot>
          </a-list-item>
          <a-divider v-if="idx < filteredEntities.length - 1" :key="`d-${idx}`" />
        </div>
      </a-list>

      <div v-else class="grey--text">No {{ title }} yet</div>
    </a-card-text>
  </a-card>
</template>

<script>
export default {
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
    },
    entities: {
      type: Array,
    },
    maxHeight: {
      type: String,
      default: '',
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
