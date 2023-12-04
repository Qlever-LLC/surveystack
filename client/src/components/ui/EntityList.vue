<template>
  <div>
    <div class="d-flex justify-space-between align-center">
      <slot v-if="!disableHeader" name="header">
        <h1>Browse {{ capitalizedCollection }}</h1>
      </slot>

      <a-btn v-if="enableAddButton" :to="`/${collection}/new`" color="primary">ADD</a-btn>
    </div>
    <a-card>
      <div v-for="e in entities" :key="e._id">
        <a-list-item :to="`/${collection}/${e._id}`">
          <a-list-item-title>{{ e.name }}</a-list-item-title>
          <a-list-item-subtitle>{{ e._id }}</a-list-item-subtitle>
        </a-list-item>
        <a-divider />
      </div>
    </a-card>
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
  computed: {
    capitalizedCollection() {
      if (!this.collection) return '';
      const v = this.collection.toString();
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
  },
};
</script>
