<template>
  <div>
    <v-card>
      <v-card-title>
        {{ title }}
        <a-spacer />
        <v-btn color="primary" class="ml-4" :to="newRoute" text>New...</v-btn>
      </v-card-title>
      <v-card-text>
        <a-text-field label="Search" v-model="q" id="oursci-group-list-search" append-icon="mdi-magnify" />
        <template v-if="entities && entities.length > 0">
          <v-list-item
            v-for="integration in integrations"
            :key="integration._id"
            two-line
            :to="`/${integrationType}-integrations/${integration._id}/edit`"
          >
            <v-list-item-content>
              <v-list-item-title>{{ integration.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ integration.type }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
        <div v-else class="grey--text">No {{ title }} yet</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import ASpacer from '@/components/ui/ASpacer.vue';
export default {
  components: {
    ASpacer,
  },
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
