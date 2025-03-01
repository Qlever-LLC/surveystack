<template>
  <a-card :loading="loading">
    <a-card-title class="text-heading d-flex pa-4">
      <slot name="title"> {{ title }} </slot>
      <a-spacer />
      <slot name="actions" v-if="editable">
        <a-btn color="primary" class="ml-4" :to="linkNew" variant="text">{{ labelNew }}</a-btn>
      </slot>
    </a-card-title>
    <a-card-text>
      <a-text-field label="Search" v-model="q" append-inner-icon="mdi-magnify" v-if="searchable" />
      <a-list
        v-if="entities.length > 0"
        :style="{
          'max-height': maxHeight || 'initial',
          'overflow-y': 'auto',
        }">
        <div v-for="(entity, idx) in filteredEntities" :key="idx">
          <a-list-item two-line :to="link(entity)">
            <template v-slot:prepend>
              <slot name="prepend" v-bind:entity="entity" />
            </template>
            <template v-slot:append>
              <slot name="append" v-bind:entity="entity" />
            </template>
            <slot name="entity" v-bind:entity="entity">
              <a-list-item-title>Title #{{ idx }}</a-list-item-title>
              <a-list-item-subtitle>Subtitle</a-list-item-subtitle>
            </slot>
          </a-list-item>
          <a-divider v-if="idx < filteredEntities.length - 1" :key="`d-${idx}`" />
        </div>
      </a-list>

      <div v-else class="text-grey">No {{ title }} yet</div>
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
