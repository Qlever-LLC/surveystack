<template>
  <v-card class="image-resource-editor p-relative">
    <v-card-title class="d-flex">
      <div>Image Resource Editor</div>
      <v-spacer />

      <v-btn icon @click="closeDialog">
        <a-icon>mdi-close</a-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-form
        v-if="
          resource &&
          (resource.label || resource.label === '') &&
          (resource.name || resource.name === '') &&
          (resource.content || resource.content === '')
        "
        ref="form"
      >
        <a-text-field
          :value="resource.label"
          @input="handleUpdateLabel"
          label="Image Label"
          :rules="[nameHasValidLength]"
          persistent-hint
          outlined
        />
        <a-text-field
          :value="resource.name"
          @input="handleUpdateName"
          label="Image Data Name"
          persistent-hint
          outlined
          :rules="[nameIsUnique(resourceNames), nameHasValidCharacters, nameHasValidLength]"
        />
        <a-text-field
          :value="resource.content"
          @input="handleUpdateContent"
          label="Image URL"
          persistent-hint
          outlined
        />
      </v-form>
    </v-card-text>
    <v-card-actions class="d-flex justify-space-between px-6 pb-4">
      <v-btn @click="deleteResource" color="error" text tabindex="-1"> Delete </v-btn>
      <v-btn @click="updateResource" text color="primary"> Update </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { nameHasValidCharacters, nameHasValidLength, nameIsUnique } from '@/utils/resources';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
  data() {
    return {};
  },
  props: {
    resources: {
      type: Array,
    },
    resource: {
      type: Object,
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
