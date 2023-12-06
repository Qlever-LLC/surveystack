<template>
  <a-card>
    <a-card-title>
      {{ title }}
      <a-spacer />
      <a-btn color="primary" class="ml-4" :to="newRoute" variant="text">New...</a-btn>
    </a-card-title>
    <a-card-text>
      <a-text-field label="Search" v-model="q" id="oursci-group-list-search" append-inner-icon="mdi-magnify" />
      <template v-if="entities && entities.length > 0">
        <a-list-item
          v-for="integration in integrations"
          :key="integration._id"
          two-line
          :to="`/${integrationType}-integrations/${integration._id}/edit`"
        >
          <a-list-item-title>{{ integration.name }}</a-list-item-title>
          <a-list-item-subtitle>{{ integration.type }}</a-list-item-subtitle>
        </a-list-item>
      </template>
      <div v-else class="text-grey">No {{ title }} yet</div>
    </a-card-text>
  </a-card>
</template>

<script>
export default {
  props: {
    entities: {
      type: Array,
    },
    title: {
      type: String,
      default: 'Integrations',
    },
    newRoute: {
      type: Object,
    },
    integrationType: {
      type: String,
      required: true,
    },
  },

  computed: {
    integrations() {
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
