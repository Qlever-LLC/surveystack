<template>
  <v-container>
    <h1>My Surveys</h1>
    <v-card>
      <v-tabs v-model="activeTab">
        <v-tab
          v-for="tab in tabs"
          :key="tab.name"
          :href="`#${tab.name}`"
        >
          {{ tab.title }}
        </v-tab>
      </v-tabs>
      <v-tabs-items v-model="activeTab">
        <v-tab-item
          v-for="tab in tabs"
          :key="tab.name"
          :value="tab.name"
        >
          <v-list>
            <v-list-item
              v-for="(item, i) in tab.content"
              :key="i"
              @click="select(item)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  ID: {{ item._id }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ (new Date(item.meta.dateCreated)).toLocaleString() }}
                </v-list-item-subtitle>
              </v-list-item-content>

            </v-list-item>
          </v-list>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

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
  created() {
    this.$store.dispatch(`submissions/${submissionsTypes.FETCH_SUBMISSIONS}`);
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
    select(draft) {
      console.log(`clicked ${draft._id}`);
      this.$router.push(`/submissions/drafts/${draft._id}`);
    },
  },
};
</script>

<style>
</style>
