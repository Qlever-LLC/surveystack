<template>
  <v-container style="height: 100%">
    <v-container
      style="height: 100%"
      class="ma-0 pa-0 mt-n4 pt-4 d-flex"
    >
      <v-row class="d-flex flex-grow-1">
        <v-tabs
          v-model="activeTab"
          class="flex-grow-0"
        >
          <v-tab
            v-for="tab in tabs"
            :key="tab.name"
            :href="`#${tab.name}`"
          >
            {{ tab.title }}
          </v-tab>
        </v-tabs>
        <v-tabs-items
          v-model="activeTab"
          style="height: 100%;"
          class="flex-grow-1"
        >
          <v-tab-item
            v-for="tab in tabs"
            :key="tab.name"
            :value="tab.name"
            class="flex-grow-1 flex-column align-center justify-center align-content-center"
            style="height: 100%;"
          >
            <v-list v-if="tab.content.length > 0">
              <template v-for="(item, i) in tab.content">
                <v-list-item
                  @click="select(item)"
                  :key="i"
                >
                  <v-list-item-content two-line>
                    <v-list-item-title v-if="surveyForSubmission(item)">
                      {{ surveyForSubmission(item).name}}
                    </v-list-item-title>
                    <v-list-item-title v-else>
                      loading name
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      ID: {{ item._id }} <br>
                      {{ (new Date(item.meta.dateCreated)).toLocaleString() }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                <v-divider
                  v-if="i + 1 < tab.content.length"
                  :key="`divider_${i}`"
                ></v-divider>
              </template>
            </v-list>
            <v-container
              fill-height
              fluid
              v-else
            >
              <v-row
                align="center"
                justify="center"
              >
                <v-col>
                  <div class="d-flex flex-column align-center">
                    <v-icon large>mdi-file-multiple</v-icon>
                    <v-alert
                      type="info"
                      text
                      class="ma-4"
                    >No drafts yet</v-alert>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
        </v-tabs-items>
      </v-row>

    </v-container>
  </v-container>
</template>

<script>
import { types as submissionsTypes } from '@/store/modules/submissions.store';

export default {
  data() {
    return {
      activeTab: 'drafts',
    };
  },
  updated() {
    this.$store.dispatch('appui/title', 'My Submissions');
  },
  async created() {
    this.$store.dispatch(`submissions/${submissionsTypes.FETCH_SUBMISSIONS}`);

    await this.$store.dispatch('surveys/fetchSurveys');
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  computed: {
    tabs() {
      return [
        {
          name: 'drafts',
          title: 'Drafts',
          content: this.$store.getters['submissions/drafts'],
        },
        {
          name: 'outbox',
          title: 'Outbox',
          content: this.$store.getters['submissions/outbox'],
        },
        {
          name: 'sent',
          title: 'Sent',
          content: this.$store.getters['submissions/sent'],
        },
      ];
    },
  },
  methods: {
    surveyForSubmission(submission) {
      return this.$store.state.surveys.surveys.find(survey => survey._id === submission.survey);
    },
    select(draft) {
      console.log(`clicked ${draft._id}`);
      this.$router.push(`/submissions/drafts/${draft._id}`);
    },
  },
};
</script>

<style>
</style>
