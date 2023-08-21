<template>
  <div class="image-resource-picker">
    Image resource picker
    <v-list>
      <v-list-item v-for="image in value" :key="image.src">
        <v-list-item-avatar>
          <a-icon>mdi-image</a-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          {{ image.name }}
        </v-list-item-content>
        <v-list-item-action>
          <a-icon>mdi-delete</a-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-btn class="ml-auto mr-0 d-block mb-3" @click="handleAddImage"> +&nbsp; Add Image </v-btn>
  </div>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
