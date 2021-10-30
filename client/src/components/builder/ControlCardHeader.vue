<template>
  <v-row class="text-left flex-nowrap flex-grow-0 flex-shrink-1" :style="{ minWidth: '0px' }">
    <v-icon :color="iconColor | 'grey lighten-1'" class="ml-3">{{ icon }}</v-icon>
    <v-col class="text-truncate">
      <div class="font-weight-light grey--text text--darken-2 text-truncate">
        {{ index }}: {{ typeName }} - {{ dataName }}
      </div>
      <div class="subtitle-1 text-truncate">
        {{ title }}
      </div>
    </v-col>
  </v-row>
</template>
<script>
import { availableControls } from '@/utils/surveyConfig';

export default {
  props: {
    index: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    dataName: { type: String, required: true },
    iconColor: { type: String, required: false },
  },
  computed: {
    controlInfo() {
      return availableControls.find(({ type }) => type === this.type);
    },
    typeName() {
      return this.controlInfo ? this.controlInfo.name : this.type;
    },
    icon() {
      return this.controlInfo ? this.controlInfo.icon : '';
    },
  },
};
</script>
