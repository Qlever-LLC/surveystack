<template>
  <a-container fluid class="py-0">
    <a-row class="pa-0">
      <a-col v-if="disabled" cols="auto" class="pa-0 mt-1"
        ><b
          >Change level:
          <span class="text-primary">{{ textByValue }}</span>
        </b>
      </a-col>
      <a-col v-else cols="auto" class="pa-0">
        <a-select
          variant="outlined"
          dense
          hide-details
          :readonly="disabled"
          v-model="content"
          @update:modelValue="$emit('update:modelValue', content)"
          :label="label ? label : 'Change type'"
          :items="availableLibraryChangeTypes"
          item-title="text"
          item-value="value" />
      </a-col>
      <a-col cols="auto" class="pa-0 align-self-center">
        <a-icon color="grey" class="ml-3 align-center">
          mdi-information-outline
          <a-tooltip bottom activator="parent"
            ><p>
              <b>Major:</b><br />
              May make data from old versions incomparable to this new version. <br />Changes existing data, how it's
              collected or interpreted. <br />QS users should review this thoroughly before updating
            </p>
            <p>
              <b>Minor:</b><br />
              A survey improvement. This doesn't change the meaning or comparability of the existing questions, it only
              adds/improves.
            </p>
            <p>
              <b>Small fix:</b><br />
              Fixes a problem or error. Everyone should update.
            </p></a-tooltip
          >
        </a-icon>
      </a-col>
    </a-row>
  </a-container>
</template>

<script>
export default {
  props: ['modelValue', 'disabled', 'label'],
  emits: ['update:modelValue'],
  data() {
    return {
      content: this.modelValue,
      availableLibraryChangeTypes: [
        { value: 'major', text: 'Major change' },
        { value: 'minor', text: 'Minor change' },
        { value: 'patch', text: 'Small fix' },
      ],
    };
  },
  computed: {
    textByValue() {
      const changeType = this.availableLibraryChangeTypes.find((type) => type.value === this.modelValue);
      return changeType ? changeType.text : 'Undefined';
    },
  },
};
</script>
