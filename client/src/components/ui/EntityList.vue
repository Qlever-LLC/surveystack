<template>
  <div>
    <div class="d-flex justify-space-between align-center">
      <slot v-if="!disableHeader" name="header">
        <h1>Browse {{ collection | capitalize }}</h1>
      </slot>

      <v-btn v-if="enableAddButton" :to="`/${collection}/new`" color="primary">ADD</v-btn>
    </div>
    <a-card>
      <div v-for="e in entities" :key="e._id">
        <v-list-item :to="`/${collection}/${e._id}`">
          <v-list-item-content>
            <v-list-item-title>{{ e.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ e._id }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
      </div>
    </a-card>
  </div>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
export default {
  components: {
    ACard,
  },
  props: {
    collection: {
      type: String,
      required: true,
    },
    entities: {
      required: true,
    },
    disableHeader: {
      type: Boolean,
      default: false,
    },
    enableAddButton: {
      type: Boolean,
      default: true,
    },
  },
};
</script>
