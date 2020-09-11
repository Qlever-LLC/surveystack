<template>
<v-card>
  <v-card-title>
    Image Resource Editor
  </v-card-title>
  <v-card-text>
    <v-form
      v-if="resource && resource.label && resource.name && (resource.content || resource.content === '')"
      ref="form"
    >
        <!-- v-model="image.label" -->
      <v-text-field
        :value="resource.label"
        @input="handleUpdateLabel"
        label="Image Label"
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
      <v-btn
        @click="updateResource"
      >
        Update
      </v-btn>
    </v-form>
  </v-card-text>
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
      image: {
        label: '',
        name: '',
        content: '',
      },
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
      console.log('form is valid?', this.$refs.form.validate());
      return this.$refs.form.validate();
    },
    updateResource() {
      console.log('update resource');
      if (this.validate()) {
        this.$emit('change', this.image);
        this.$emit('close-dialog');
      }
    },
    // TODO: refactor to use internal data for resource, then only update resource on survey when button is clicked
    handleUpdateLabel(label) {
      console.log('update label', label);
      this.$emit('change', {
        ...this.resource,
        label,
      });
    },
    handleUpdateName(name) {
      console.log('update name', name);
      this.$emit('change', {
        ...this.resource,
        name,
      });
    },
    handleUpdateContent(content) {
      console.log('update content', content);
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
