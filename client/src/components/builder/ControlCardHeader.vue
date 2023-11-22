<template>
  <v-row class="text-left flex-nowrap flex-grow-0 flex-shrink-1" :style="{ minWidth: '0px' }">
    <a-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <a-icon :color="iconColor" large class="ml-3" v-bind="attrs" v-on="on">{{ icon }}</a-icon>
      </template>
      <span>{{ typeName }}</span>
    </a-tooltip>
    <v-col class="body-1 text-truncate">
      <div class="font-weight-light grey--text text--darken-2">
        <span class="text-truncate">{{ index }}: {{ dataName }}</span>
        <a-chip v-if="chipLabel" class="ml-2" style="margin-top: -2px" outlined small :color="chipColor">
          {{ chipLabel }}
        </a-chip>
      </div>
      <div class="text-truncate">
        {{ title }}
      </div>
    </v-col>
  </v-row>
</template>
<script>
import { availableControls } from '@/utils/surveyConfig';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
  props: {
    index: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    dataName: { type: String, required: true },
    iconColor: { type: String, default: 'grey lighten-1' },
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
