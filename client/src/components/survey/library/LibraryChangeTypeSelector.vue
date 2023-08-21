<template>
  <v-container fluid class="py-0">
    <v-row class="pa-0">
      <v-col v-if="disabled" cols="auto" class="pa-0 mt-1"
        ><b
          >Change level:
          <span class="primary--text">{{ textByValue }}</span>
        </b></v-col
      >
      <v-col v-else cols="auto" class="pa-0">
        <v-select
          outlined
          dense
          hide-details
          :readonly="disabled"
          v-model="content"
          :label="label ? label : 'Change type'"
          :items="availableLibraryChangeTypes"
          @input="$emit('input', content)"
        />
      </v-col>
      <v-col cols="auto" class="pa-0 align-self-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <a-icon color="grey" dark v-bind="attrs" v-on="on" class="ml-3 align-center">
              mdi-information-outline
            </a-icon>
          </template>
          <p>
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
          </p>
        </v-tooltip>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  name: 'library-change-type-selector',
  components: { AIcon },
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
  computed: {
    textByValue() {
      const changeType = this.availableLibraryChangeTypes.find((type) => type.value === this.value);
      return changeType ? changeType.text : 'Undefined';
    },
  },
};
</script>
