<template>
  <v-select
    outlined
    :readonly="disabled"
    v-model="content"
    :label="label ? label : 'Change type'"
    :items="availableLibraryChangeTypes"
    @input="$emit('input', content)"
  />
</template>
<script>
export default {
  name: 'library-change-type-selector',
  props: ['value', 'disabled', 'label'],
  data() {
    return {
      content: this.value,
      availableLibraryChangeTypes: [
        { value: 'major', text: 'Major change' },
        { value: 'minor', text: 'Minor change' },
        { value: 'patch', text: 'Small fix' },
      ],
    };
  },
};
</script>
