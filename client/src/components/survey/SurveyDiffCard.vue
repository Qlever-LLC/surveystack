<template>
  <v-card class="control-item d-flex flex-column" :data-testid="`diff-card-${diffInfo.indexPath}`">
    <button @click="isOpen = !isOpen" :disabled="!haveChangeDetails">
      <v-row>
        <control-card-header
          :index="diffInfo.indexPath"
          :title="diffInfo.label"
          :icon-color="diffInfo.color"
          :type="diffInfo.controlType"
          :dataName="diffInfo.name"
          class="ml-3 align-self-center"
        />

        <v-chip class="ma-3 align-self-start" outlined small :color="diffInfo.color">{{ diffInfo.changeType }}</v-chip>
        <v-spacer />
        <v-icon v-if="haveChangeDetails" class="mr-5 align-self-center" :class="{ 'mdi-rotate-180': !isOpen }"
          >mdi-chevron-down</v-icon
        >
      </v-row>
    </button>
    <v-simple-table v-if="isOpen" fixed-header class="mb-4">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left"></th>
            <th class="text-left">{{ oldVersionName }}</th>
            <th class="text-left">{{ newVersionName }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="diffInfo in diffInfo.changeList" :key="diffInfo.key">
            <td>{{ diffInfo.key }}</td>
            <td>{{ diffInfo.oldValue }}</td>
            <td>{{ diffInfo.newValue }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <slot></slot>
  </v-card>
</template>

<script>
import ControlCardHeader from '../builder/ControlCardHeader';
import { changeType } from '@/utils/surveyDiff';

export default {
  name: 'survey-diff-card',
  components: {
    ControlCardHeader,
  },
  data() {
    return {
      isOpen: false,
    };
  },
  props: {
    diffInfo: {
      type: Object,
      required: true,
    },
    oldVersionName: {
      type: String,
      required: true,
    },
    newVersionName: {
      type: String,
      required: true,
    },
  },
  computed: {
    haveChangeDetails() {
      return this.diffInfo.changeType === changeType.CHANGED;
    },
  },
};
</script>
<style scoped>
.control-item {
  padding: 0.25rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  border-left-width: 2px;
  position: relative;
}
</style>
