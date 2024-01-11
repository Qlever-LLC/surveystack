<template>
  <a-row class="text-left flex-nowrap flex-grow-0 flex-shrink-1" cssMinWidth0px>
    <a-icon :color="iconColor" x-large class="ml-3 align-self-center">
      {{ icon }}
      <a-tooltip bottom activator="parent">{{ typeName }}</a-tooltip>
    </a-icon>
    <a-col class="text-truncate">
      <div class="font-weight-light text-grey-darken-2" style="line-height: 1.5rem">
        <span class="text-truncate">{{ index }}: {{ dataName }}</span>
        <a-chip v-if="chipLabel" class="ml-2" style="margin-top: -2px" variant="outlined" small :color="chipColor">
          {{ chipLabel }}
        </a-chip>
      </div>
      <div class="text-truncate">
        {{ title }}
      </div>
    </a-col>
  </a-row>
</template>
<script>
import { availableControls } from '@/utils/surveyConfig';

export default {
  props: {
    index: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    dataName: { type: String, required: true },
    iconColor: { type: String, default: 'grey-lighten-1' },
    chipLabel: { type: String, required: false },
    chipColor: { type: String, required: false },
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
