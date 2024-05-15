<template>
  <a-container>
    <app-dialog
      v-model="learnMoreDialog"
      title="Premium Features"
      @confirm="learnMoreDialog = false"
      @cancel="learnMoreDialog = false">
      <p>
        With a paid subscription you can upgrade to
        <strong>your own white-labelled app</strong> with a <strong>custom url</strong>, and your
        <strong>branding</strong> and <strong>color scheme</strong>. You will also benefit from more administrative
        tools to improve project and data management:
      </p>
      <ul class="my-3 revertPadding">
        <li>Allow any user to join your group from your custom url.</li>
        <li>See all your group and pinned surveys without being logged in to your app.</li>
        <li>
          Automatically associate data submitted to your custom url to your group so that you have proper administrative
          controls over data privacy.
        </li>
      </ul>
      <p>
        To learn more about paid subscriptions please contact Dan TerAvest (<a href="mailto:dan@our-sci.net"
          >dan@our-sci.net</a
        >) or Greg Austic (<a href="mailto:greg@our-sci.net">greg@our-sci.net</a>)
      </p>
    </app-dialog>

    <a-card :loading="isLoadingGroup" color="background">
      <a-card-title class="text-heading d-flex pa-4">
        <a-col align="start" class="flex-grow-0">
          <AppNavigationControl />
        </a-col>
        <a-col class="flex-grow-1 pl-0" :class="'text-center'">
          <a-icon class="mr-2" :icon="editMode ? 'mdi-cog-outline' : 'mdi-account-group'" />
          {{ editMode ? 'Edit group' : 'Create group' }}
          <a-chip v-if="isPremium" class="ml-2" color="success" rounded="lg" variant="flat" disabled>
            <a-icon small left> mdi-octagram </a-icon>Premium
          </a-chip>
        </a-col>
      </a-card-title>
      <a-card-text>
        <form @submit.prevent="onSubmit" autocomplete="off">
          <a-text-field
            label="Name"
            placeholder="Enter group name"
            id="group-name"
            autocomplete="off"
            v-model="entity.name" />
          <a-text-field
            label="Slug"
            placeholder="Enter group slug or use suggested"
            id="group-slug"
            v-model="entity.slug"
            :readonly="!editSlug"
            :append-inner-icon="editSlug ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
            autocomplete="off"
            @click:appendInner="editSlug = !editSlug"
            hint="URL friendly version of name"
            persistent-hint
            :disabled="isWhitelabel && entity.path === whitelabelPartner.path" />
          <div class="d-flex align-center mt-6">
            <a-checkbox
              label="Invitation Only"
              v-model="entity.meta.invitationOnly"
              :hideDetails="false"
              :hint="
                entity.meta.invitationOnly
                  ? 'Users can only join through an invitation'
                  : 'Everybody may join this group'
              "
              persistentHint
              :disabled="!isPremium"
              class="d-inline mt-0" />
            <div class="ml-auto ml-sm-6">
              <a-btn small v-if="!isPremium" @click="learnMoreDialog = true" variant="outlined" color="primary"
                >Learn more...
              </a-btn>
            </div>
          </div>
          <a-checkbox label="Archived" v-model="entity.meta.archived" />
          <div class="d-flex justify-end pa-2">
            <a-btn variant="text" @click="cancel">Cancel</a-btn>
            <a-btn color="primary" type="submit">{{ editMode ? 'Save' : 'Create' }}</a-btn>
          </div>
        </form>
      </a-card-text>
      <basic-list
        v-if="editMode"
        listRow
        :showNavigationControl="false"
        :entities="subgroups"
        title="Subgroups"
        :menu="[
          {
            title: 'Go to Group',
            icon: 'mdi-open-in-new',
            action: (e) => `/groups/${e._id}`,
            color: 'green',
          },
        ]"
        :buttonNew="{ title: 'new...', link: { name: 'groups-new', query: { dir: entity.path } } }">
        <template v-slot:entityTitle="{ entity }">
          {{ entity.name }}
        </template>
        <template v-slot:entitySubtitle="{ entity }">
          {{ entity.path }}
        </template>
      </basic-list>
      <basic-list
        v-if="editMode"
        listCard
        :showNavigationControl="false"
        :entities="integrations"
        title="Integrations"
        :menu="[
          {
            title: 'Go to',
            icon: 'mdi-open-in-new',
            action: (integration) => `/groups/${entity._id}/${integration.slug}`,
            color: 'green',
          },
        ]">
        <template v-slot:entitySubtitle="{ entity }">
          {{ entity.description }}
        </template>
      </basic-list>
      <app-pinned-surveys
        class="ma-4"
        v-if="editMode"
        :entities="entity.surveys.pinned"
        :searchResults="searchResults"
        @search="searchSurveys">
      </app-pinned-surveys>

      <app-doc-links class="ma-4" v-if="editMode" :group="entity"> </app-doc-links>
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import appPinnedSurveys from '@/components/groups/PinnedSurveys.vue';
import appDocLinks from '@/components/groups/DocLinks.vue';
import BasicList from '@/components/ui/BasicList2.vue';
import appDialog from '@/components/ui/Dialog.vue';
import { handleize } from '@/utils/groups';
import { SPEC_VERSION_GROUP } from '@/constants';
import AppNavigationControl from '@/components/AppNavigationControl.vue';
import { useDisplay } from 'vuetify';

const integrations = [
  {
    name: 'FarmOS',
    description: 'Manage FarmOS integration',
    slug: `farmos`, // used for the link /group-manage/farmos/$GROUP_ID
  },
  {
    name: 'Hylo',
    description: 'Manage Hylo integration',
    slug: `hylo`, // used for the link /group-manage/farmos/$GROUP_ID
  },
];

export default {
  components: {
    AppNavigationControl,
    appPinnedSurveys,
    appDocLinks,
    BasicList,
    appDialog,
  },
  data() {
    return {
      editSlug: false,
      editMode: true,
      entity: {
        meta: {
          archived: false,
          specVersion: SPEC_VERSION_GROUP,
          invitationOnly: true,
        },
        name: '',
        slug: '',
        dir: '/',
        path: '',
        surveys: {
          pinned: [],
        },
      },
      subgroups: [],
      searchResults: [],
      learnMoreDialog: false,
      integrations,
      isLoadingGroup: false,
    };
  },
  methods: {
    async onSubmit() {
      if (this.entity.name.trim() === '') {
        console.log('name must not be empty');
        return;
      }

      if (this.entity.slug.trim() === '') {
        console.log('slug must not be empty');
        return;
      }

      try {
        if (this.editMode) {
          await api.put(`/groups/${this.entity._id}`, this.entity);
        } else {
          await api.post('/groups', this.entity);
        }

        this.$router.push(`/groups/${this.entity._id}/settings`);
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
        console.log(err);
      }
    },
    cancel() {
      this.$router.back();
    },
    async searchSurveys(q) {
      const { data: searchResults } = await api.get(
        `/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`
      );
      this.searchResults = searchResults;
    },
    async getSubgroups() {
      try {
        const { data } = await api.get(`/groups/all?showArchived=${this.entity.meta.archived}&dir=${this.entity.path}`);
        this.subgroups = data;
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
  },
  watch: {
    'entity.name': {
      handler(newVal) {
        if (!this.editMode) {
          const handle = handleize(newVal);
          this.entity.slug = handle;
        }
      },
    },
    'entity.slug': {
      handler(newVal) {
        const handle = handleize(newVal);
        this.entity.slug = handle;
      },
    },
    'entity.meta.archived': {
      handler() {
        this.getSubgroups();
      },
    },
  },
  computed: {
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    isPremium() {
      if (
        this.isWhitelabel &&
        (this.entity.path.startsWith(this.whitelabelPartner.path) ||
          this.entity.dir.startsWith(this.whitelabelPartner.path))
      ) {
        return true;
      }
      return false;
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(({ name }) => name === 'groups-new');

    const { dir } = this.$route.query;
    if (dir) {
      this.entity.dir = dir;
      if (!this.entity.dir.endsWith('/')) {
        this.entity.dir += '/';
      }
    }

    if (this.editMode) {
      this.isLoadingGroup = true;
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/groups/${id}?populate=true`);
        this.entity = { ...this.entity, ...data };
        await this.getSubgroups();
      } catch (e) {
        console.log('something went wrong:', e);
      } finally {
        this.isLoadingGroup = false;
      }
    }
  },
};
</script>

<style scoped lang="scss">
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}

.revertPadding {
  padding: revert;
}
</style>
