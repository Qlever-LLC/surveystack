<template>
  <a-list dense class="mt">
    <a-list-item class="pa-0">
      <a-expansion-panels
        class="pa-0 ma-0 no-background"
        variant="accordion"
        style="min-height: 0px !important"
        :modelValue="docs.length > 2 ? undefined : 0">
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
                v-for="(doc, index) in docs"
                :key="doc.link + index"
                :href="doc.link"
                target="_blank"
                prepend-icon="mdi-notebook"
                class="text-white">
                <a-list-item-title class="text-white">{{ doc.label }}</a-list-item-title>
              </a-list-item>

              <a-list-item
                href="https://our-sci.gitlab.io/software/surveystack_tutorials/"
                target="_blank"
                prepend-icon="mdi-help-circle-outline"
                class="pa-0 text-white">
                <a-list-item-title class="text-white">SurveyStack Help</a-list-item-title>
              </a-list-item>
              <v-list-item
                href="https://www.surveystack.io"
                target="_blank"
                prepend-icon="mdi-information-outline"
                class="pa-0 text-white">
                <a-list-item-title class="text-white">About</a-list-item-title>
              </v-list-item>
            </a-list>
          </a-expansion-panel-text>
        </a-expansion-panel>
      </a-expansion-panels>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { useGroup } from '@/components/groups/group';
import { computed } from 'vue';
import { useStore } from 'vuex';

const { getActiveGroup } = useGroup();
const store = useStore();

//TODO what was this for? check master
let groupsLink = '/groups';
if (store.getters['whitelabel/isWhitelabel']) {
  groupsLink = `/g${store.getters['whitelabel/partner'].path}`;
}

const docs = computed(() => {
  return getActiveGroup()?.docs || [];
});
</script>

<style scoped lang="scss">
.no-background {
  background-color: transparent;
}
</style>
