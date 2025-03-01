<template>
  <app-info v-model="state.showAppInfo" />
  <a-list dense class="mt">
    <template v-if="state.docs?.length > 0">
      <div class="ml-4 mt-4 mb-4 text-white text-body-2">Documentation</div>
      <a-list-item
        v-for="(doc, index) in state.docs"
        :key="doc.link + index"
        :href="doc.link"
        target="_blank"
        prepend-icon="mdi-notebook"
        class="text-white">
        <a-list-item-title class="text-white">{{ doc.label }}</a-list-item-title>
      </a-list-item>
    </template>
    <a-list-item class="pa-0 mt-4">
      <a-expansion-panels
        class="pa-0 ma-0 no-background"
        variant="accordion"
        style="min-height: 0px !important"
        v-model="expanded">
        <a-expansion-panel class="no-background">
          <a-expansion-panel-title
            class="py-0 pl-0 text-white"
            css-transparent-overlay
            style="min-height: 0px !important">
            <a-list-subheader class="text-white">Learn SurveyStack</a-list-subheader>
          </a-expansion-panel-title>
          <a-expansion-panel-text class="pa-0 ma-0">
            <a-list class="pa-0 ma-0">
              <a-list-item
                href="https://our-sci.gitlab.io/software/surveystack_tutorials/"
                target="_blank"
                prepend-icon="mdi-help-circle-outline"
                class="pa-0 text-white">
                <a-list-item-title class="text-white">SurveyStack Help</a-list-item-title>
              </a-list-item>
              <a-list-item
                href="https://www.surveystack.io"
                target="_blank"
                prepend-icon="mdi-information-outline"
                class="pa-0 text-white">
                <a-list-item-title class="text-white">About</a-list-item-title>
              </a-list-item>
              <a-list-item
                @click="state.showAppInfo = true"
                prepend-icon="mdi-information-outline"
                class="pa-0 text-white">
                <a-list-item-title class="text-white">Version {{ lcl.shortHash }} </a-list-item-title>
              </a-list-item>
            </a-list>
          </a-expansion-panel-text>
        </a-expansion-panel>
      </a-expansion-panels>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';
import { reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppInfo from '@/pages/app/AppInfo.vue';

const route = useRoute();
const { getActiveGroup } = useGroup();
const lcl = JSON.parse(process.env.VUE_APP_LCL);

const expanded = ref(false);

const state = reactive({
  docs: [],
  showAppInfo: false,
});

initData();

watch(route, () => {
  initData();
});

async function initData() {
  const activeGroup = await getActiveGroup();
  if (activeGroup) {
    state.docs = activeGroup.docs;
  }
}
</script>

<style scoped lang="scss">
.no-background {
  background-color: transparent;
}
</style>
