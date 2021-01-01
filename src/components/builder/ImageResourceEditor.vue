<template>
  <v-card class="image-resource-editor p-relative">
    <v-card-title class="d-flex">
      <div>
        Image Resource Editor
      </div>
      <v-spacer />

      <v-btn
        icon
        @click="closeDialog"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </v-card-title>
    <v-card-text>
      <v-form
        v-if="resource && (resource.label || resource.label === '') && (resource.name || resource.name === '') && (resource.content || resource.content === '')"
        ref="form"
      >
        <!-- v-model="image.label" -->
        <v-text-field
          :value="resource.label"
          @input="handleUpdateLabel"
          label="Image Label"
          :rules="[nameHasValidLength]"
          persistent-hint
          outlined
        />
        <!-- v-model="image.name" -->
        <v-text-field
          :value="resource.name"
          @input="handleUpdateName"
          label="Image Data Name"
          persistent-hint
          outlined
          :rules="[nameIsUnique(resourceNames), nameHasValidCharacters, nameHasValidLength]"
        />
        <!-- v-model="image.content" -->
        <v-text-field
          :value="resource.content"
          @input="handleUpdateContent"
          label="Image URL"
          persistent-hint
          outlined
        />
      </v-form>
    </v-card-text>
    <v-card-actions class="d-flex justify-space-between px-6 pb-4">
      <v-btn
        @click="deleteResource"
        color="error"
        text
        tabindex="-1"
      >
        Delete
      </v-btn>
      <v-btn
        @click="updateResource"
        text
        color="primary"
      >
        Update
      </v-btn>

      <!-- <v-btn
      @click="closeDialog"
      text
    >
      Close
    </v-btn> -->
    </v-card-actions>
  </v-card>
</template>

<script>
import ObjectId from 'bson-objectid';
import {
  resourceTypes,
  resourceLocations,
  nameIsUnique,
  nameHasValidCharacters,
  nameHasValidLength,
} from '@/utils/resources';

export default {
  data() {
    return {
      // image: {
      //   label: '',
      //   name: '',
      //   content: '',
      // },
    };
  },
  // // beforeUpdate() {
  // //   this.image = {
  // //     ...this.resource,
  // //   };
  // // },
  // created() {
  //   // this.image = {
  //   //   ...this.resource,
  //   // };
  // },
  // watch: {
  //   resource(newVal) {
  //     this.image = {
  //       ...newVal,
  //     };
  //   },
  // },
  props: {
    resources: {
      type: Array,
    },
    resource: {
      type: Object,
      // default: () => {
      //   const id = ObjectId().toString();
      //   return {
      //     content: '',
      //     // label: `Image ${id.substring(20)}`,
      //     // name: `image_${id.substring(20)}`,
      //     label: `Image ${this.resources.length + 1}`,
      //     name: `image_${this.resources.length + 1}`,
      //     id,
      //     type: resourceTypes.IMAGE,
      //     location: resourceLocations.REMOTE,
      //   };
      // },
    },
  },
  computed: {
    resourceNames() {
      return this.resources.map(({ name, id }) => ({ name, id }));
    },
  },
  methods: {
    nameIsUnique,
    nameHasValidCharacters,
    nameHasValidLength,
    validate() {
      return this.$refs.form.validate();
    },
    deleteResource() {
      this.closeDialog();
      this.$emit('delete', this.resource.id);
    },
    updateResource() {
      if (this.validate()) {
        // this.$emit('change', this.image);
        this.$emit('close-dialog');
      }
    },
    closeDialog() {
      if (!this.resource || this.validate()) {
        this.$emit('close-dialog');
      }
    },
    // TODO: refactor to use internal data for resource, then only update resource on survey when button is clicked
    handleUpdateLabel(label) {
      this.$emit('change', {
        ...this.resource,
        label,
      });
    },
    handleUpdateName(name) {
      this.$emit('change', {
        ...this.resource,
        name,
      });
    },
    handleUpdateContent(content) {
      this.$emit('change', {
        ...this.resource,
        content,
      });
    },
  },
};
</script>

<style>
</style>
