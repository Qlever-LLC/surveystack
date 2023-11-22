<template>
  <div>
    <div class="d-flex justify-space-between align-center">
      <slot v-if="!disableHeader" name="header">
        <h1>Browse {{ collection | capitalize }}</h1>
      </slot>

      <v-btn v-if="enableAddButton" :to="`/${collection}/new`" color="primary">ADD</v-btn>
    </div>
    <v-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/${collection}/${e._id}`">
          <v-list-item-content>
            <a-list-item-title>{{ e.name }}</a-list-item-title>
            <a-list-item-subtitle>{{ e._id }}</a-list-item-subtitle>
          </v-list-item-content>
        </a-list-item>
        <a-divider />
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
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
