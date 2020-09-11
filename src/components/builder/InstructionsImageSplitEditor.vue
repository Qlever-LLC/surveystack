<template>
  <div class="instructions-image-split-editor">
    <!-- <image-resource-picker
      :value="value.images"
      @input="handleImagesChange"
      :resources="resources"
    /> -->
    <div class="text-center d-flex">
      <resource-selector
        :resources="filteredResources"
        :value="value && value.images && value.images[0]"
        newResourceType="IMAGE"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
      />
      <v-btn
        icon
        @click.stop="openDialog"
        :class="{'d-none': !value}"
        class="ml-2 mt-3"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </div>
    <v-textarea
      :value="value.body"
      @input="handleBodyChange"
      outlined
      label="Instructions Body (Markdown)"
    />

    <v-dialog
      v-model="imageDialogIsVisible"
      width="500"
    >
      <!-- <select-items-table-editor
        :resources="filteredResources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeTableDialog"
      /> -->
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
// import ImageResourcePicker from '@/components/builder/ImageResourcePicker.vue';
import ResourceSelector from '@/components/builder/ResourceSelector.vue';
import ImageResourceEditor from '@/components/builder/ImageResourceEditor.vue';
import {
  removeResource,
  setResource,
  createResource,
  resourceTypes,
  resourceLocations,
  appendResource,
} from '@/utils/resources';

export default {
  data() {
    return {
      imageDialogIsVisible: false,
    };
  },
  components: {
    // ImageResourcePicker,
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
      // type: String,
    },
    resources: {
      type: Array,
      default: () => ([]),
    },
  },
  computed: {
    filteredResources() {
      return this.resources.filter(resource => resource.type === 'IMAGE');
    },
    resource() {
      return this.resources.find(resource => resource.id === this.value.images[0]);
    },
  },
  methods: {
    handleImagesChange(images) {
      this.$emit('input', {
        body: this.value.body,
        images,
      });
    },
    handleBodyChange(body) {
      // this.$emit('input', {
      //   body,
      //   images: this.value.images,
      // });
      this.$emit('set-control-source', {
        body,
        images: this.value.images,
      });
    },
    removeResource(id) {
      const newResources = removeResource(this.resources, id);
      this.$emit('set-survey-resources', newResources);

      const newImages = this.value.images.filter(imageId => imageId !== id);
      this.$emit('set-control-source', {
        body: this.value.body,
        images: newImages,
      });
    },
    setResource(resource) {
      const newResources = setResource(this.resources, resource);
      this.$emit('set-survey-resources', newResources);
    },
    createResourceHandler() {
      const newResource = createResource(
        this.resources,
        resourceTypes.IMAGE,
        resourceLocations.REMOTE,
        {
          labelPrefix: 'Image',
          defaultContent: '',
        },
      );
      console.log(newResource);
      this.$emit('set-survey-resources', appendResource(this.resources, newResource));
      this.$emit('set-control-source', {
        body: this.value.body,
        images: [newResource.id],
      });
      this.openDialog();
    },
    selectResourceHandler(id) {
      console.log();
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

<style scoped>

</style>
