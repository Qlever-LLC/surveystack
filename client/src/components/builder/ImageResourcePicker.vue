<template>
  <div class="image-resource-picker">
    Image resource picker
    <v-list>
      <a-list-item v-for="image in value" :key="image.src">
        <v-list-item-avatar>
          <a-icon>mdi-image</a-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          {{ image.name }}
        </v-list-item-content>
        <a-list-item-action>
          <a-icon>mdi-delete</a-icon>
        </a-list-item-action>
      </a-list-item>
    </v-list>
    <v-btn class="ml-auto mr-0 d-block mb-3" @click="handleAddImage"> +&nbsp; Add Image </v-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeImage: null,
    };
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    handleAddImage() {},
  },
};
</script>

<style></style>
