<template>
  <div class="instructions-image-split-editor">
    <div class="text-center d-flex">
      <resource-selector
        :resources="filteredResources"
        :value="(value && value.images && value.images[0]) || null"
        :disabled="disabled"
        :newResourceTypes="[resourceTypes.IMAGE]"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
      />
      <v-btn
        icon
        @click.stop="openDialog"
        :disabled="disabled"
        :class="{ 'd-none': !value }"
        class="ml-2 mt-3"
        v-if="resource"
      >
        <a-icon>mdi-pencil</a-icon>
      </v-btn>
    </div>
    <a-textarea
      class="mt-3"
      label="Instructions Body (Markdown)"
      :value="value.body"
      @input="handleBodyChange"
      :disabled="disabled"
      hide-details
    />

    <v-dialog v-model="imageDialogIsVisible" width="500">
      <image-resource-editor
        :resources="filteredResources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeDialog"
      />
    </v-dialog>
  </div>
</template>

<script>
import ResourceSelector from '@/components/builder/ResourceSelector.vue';
import ImageResourceEditor from '@/components/builder/ImageResourceEditor.vue';
import {
  appendResource,
  createResource,
  removeResource,
  resourceLocations,
  resourceTypes,
  setResource,
} from '@/utils/resources';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  data() {
    return {
      resourceTypes,
      imageDialogIsVisible: false,
    };
  },
  components: {
    AIcon,
    ResourceSelector,
    ImageResourceEditor,
  },
  props: {
    value: {
      type: Object,
      default: () => ({
        images: [],
        body: '',
      }),
    },
    resources: {
      type: Array,
      default: () => [],
    },
    disabled: {
      required: false,
    },
  },
  computed: {
    filteredResources() {
      return this.resources.filter((resource) => resource.type === resourceTypes.IMAGE);
    },
    resource() {
      return this.resources.find((resource) => resource.id === this.value.images[0]);
    },
  },
  methods: {
    handleBodyChange(body) {
      this.$emit('set-control-source', { body, images: this.value.images });
    },
    removeResource(id) {
      const newResources = removeResource(this.resources, id);
      this.$emit('set-survey-resources', newResources);

      const newImages = this.value.images.filter((imageId) => imageId !== id);
      this.$emit('set-control-source', {
        body: this.value.body,
        images: newImages,
      });

      this.closeDialog();
    },
    setResource(resource) {
      const newResources = setResource(this.resources, resource);
      this.$emit('set-survey-resources', newResources);
    },
    createResourceHandler() {
      const newResource = createResource(this.resources, resourceTypes.IMAGE, resourceLocations.REMOTE, {
        labelPrefix: 'Image',
        defaultContent: '',
      });
      this.$emit('set-survey-resources', appendResource(this.resources, newResource));
      this.$emit('set-control-source', {
        body: this.value.body,
        images: [newResource.id],
      });
      this.openDialog();
    },
    selectResourceHandler(id) {
      this.$emit('set-control-source', {
        body: this.value.body,
        images: [id],
      });
    },
    openDialog() {
      this.imageDialogIsVisible = true;
    },
    closeDialog() {
      this.imageDialogIsVisible = false;
    },
  },
};
</script>

<style scoped></style>
