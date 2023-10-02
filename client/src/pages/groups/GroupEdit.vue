<template>
  <v-container>
    <app-dialog
      v-model="learnMoreDialog"
      title="Premium Features"
      @confirm="learnMoreDialog = false"
      @cancel="learnMoreDialog = false"
    >
      <p>
        With a paid subscription you can upgrade to
        <strong>your own white-labelled app</strong> with a <strong>custom url</strong>, and your
        <strong>branding</strong> and <strong>color scheme</strong>. You will also benefit from more administrative
        tools to improve project and data management:
      </p>
      <ul class="my-3">
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

    <div class="d-flex justify-space-between align-center">
      <app-group-breadcrumbs :path="entity.path" />
    </div>

    <div class="d-flex justify-space-between">
      <h1>
        <span>{{ editMode ? 'Edit group' : 'Create group' }}</span>
        <v-chip v-if="isPremium" class="ml-2" color="success">
          <v-icon small left> mdi-octagram </v-icon>Premium
        </v-chip>
      </h1>
      <v-btn
        v-if="editMode"
        :disabled="!entity._id"
        class="ma-2"
        :to="`/call-for-submissions?group=${entity._id}`"
        color="secondary"
      >
        <v-icon left>mdi-email-multiple-outline</v-icon>Call for submissions...
      </v-btn>
    </div>
    <v-card :loading="isLoadingGroup" class="mb-4">
      <v-card-text>
        <form @submit.prevent="onSubmit" autocomplete="off">
          <v-text-field
            label="Name"
            placeholder="Enter group name"
            id="group-name"
            autocomplete="off"
            v-model="entity.name"
          />
          <v-text-field
            label="Slug"
            placeholder="Enter group slug or use suggested"
            id="group-slug"
            v-model="entity.slug"
            :readonly="!editSlug"
            :append-icon="editSlug ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
            autocomplete="off"
            @click:append="editSlug = !editSlug"
            hint="URL friendly version of name"
            persistent-hint
            :disabled="isWhitelabel && entity.path === whitelabelPartner.path"
          />
          <div class="d-flex align-center mt-6">
            <v-checkbox
              label="Invitation Only"
              v-model="entity.meta.invitationOnly"
              :hint="
                entity.meta.invitationOnly
                  ? 'Users can only join through an invitation'
                  : 'Everybody may join this group'
              "
              persistent-hint
              :disabled="!isPremium"
              class="d-inline mt-0"
            />
            <div class="ml-auto ml-sm-6">
              <v-btn small v-if="!isPremium" @click="learnMoreDialog = true" outlined color="primary"
                >Learn more...
              </v-btn>
            </div>
          </div>
          <v-checkbox label="Archived" v-model="entity.meta.archived" />
          <div class="d-flex justify-end pa-2">
            <v-btn text @click="cancel">Cancel</v-btn>
            <v-btn color="primary" type="submit">{{ editMode ? 'Save' : 'Create' }}</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" lg="12">
        <app-basic-list
          maxHeight="500px"
          :loading="isLoadingMembers || isLoadingHyloGroup"
          editable
          class="mb-4"
          v-if="editMode"
          :entities="members"
          title="Members"
          :link="(member) => `/memberships/${member._id}/edit`"
          :linkNew="{
            name: 'memberships-new',
            query: { group: entity._id, role: 'user' },
          }"
          :filter="filterMembers"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content v-if="entity.meta && entity.meta.status === 'pending'">
              <v-list-item-title class="text--secondary"
                >[Pending] {{ entity.meta.invitationEmail
                }}{{ entity.meta.invitationName ? ` - ${entity.meta.invitationName}` : '' }}</v-list-item-title
              >
              <v-list-item-subtitle>{{
                entity.meta.dateSent ? `sent ${entity.meta.dateSent}` : 'Invitation not sent yet'
              }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-content v-else>
              <v-list-item-title>{{ entity.user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ entity.user.email }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action @mousedown.stop @touchstart.stop @click.prevent>
              <v-row style="gap: 12px">
                <app-confirm-membership-button
                  v-if="entity.meta && entity.meta.status === 'pending'"
                  :membershipId="entity._id"
                  :email="entity.meta.invitationEmail"
                  @confirmed="loadMembers"
                />
                <app-member-hylo-status
                  v-if="entity.meta && entity.meta.status === 'active' && integratedHyloGroup"
                  :loading="isLoadingHyloGroup"
                  :membershipId="entity._id"
                  :hyloGroup="integratedHyloGroup"
                  :userName="entity.user.name"
                  @updated="loadHyloGroup"
                />
                <v-icon v-if="entity.role === 'admin'">mdi-crown-outline</v-icon>
              </v-row>
            </v-list-item-action>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="12">
        <app-basic-list
          class="mb-4"
          v-if="editMode"
          :entities="integrations"
          title="Integrations"
          :link="(integration) => `/group-manage/${integration.slug}/${entity._id}`"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <v-list-item-title>{{ entity.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ entity.description }} </v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="12">
        <app-pinned-surveys
          class="mb-4"
          v-if="editMode"
          :entities="entity.surveys.pinned"
          :searchResults="searchResults"
          @search="searchSurveys"
        >
        </app-pinned-surveys>
      </v-col>
    </v-row>

    <app-doc-links class="mb-4" v-if="editMode" :group="entity"> </app-doc-links>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appPinnedSurveys from '@/components/groups/PinnedSurveys.vue';
import appDocLinks from '@/components/groups/DocLinks.vue';
import appBasicList from '@/components/ui/BasicList.vue';
import appDialog from '@/components/ui/Dialog.vue';
import appGroupBreadcrumbs from '@/components/groups/Breadcrumbs.vue';
import appConfirmMembershipButton from '@/components/shared/ConfirmMembershipButton.vue';
import appMemberHyloStatus from './MemberHyloStatus.vue';
import { handleize } from '@/utils/groups';
import { SPEC_VERSION_GROUP } from '@/constants';
import { get } from 'lodash';

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
    appPinnedSurveys,
    appDocLinks,
    appBasicList,
    appDialog,
    appGroupBreadcrumbs,
    appConfirmMembershipButton,
    appMemberHyloStatus,
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
      searchResults: [],
      members: [],
      integratedHyloGroup: null,
      learnMoreDialog: false,
      isLoadingMembers: false,
      isLoadingGroup: false,
      isLoadingHyloGroup: false,
    };
  },
  methods: {
    async loadMembers() {
      this.isLoadingMembers = true;
      try {
        const { data: members } = await api.get(`/memberships?group=${this.entity._id}&populate=true`);
        this.members = members;
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isLoadingMembers = false;
      }
    },
    async loadHyloGroup() {
      this.isLoadingHyloGroup = true;
      try {
        this.integratedHyloGroup = (await api.get(`/hylo/integrated-group/${this.entity._id}`)).data;
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoadingHyloGroup = false;
      }
    },
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

        this.$router.push(`/g${this.entity.dir}${this.entity.slug}/`);
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
    filterMembers(entities, q) {
      if (!q) {
        return entities;
      }
      const ql = q.toLowerCase();

      return entities.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(ql) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(ql)) {
            return true;
          }
        } else if (entity.meta.invitationEmail) {
          if (entity.meta.invitationEmail.toLowerCase().indexOf(ql) > -1) {
            return true;
          }
        }

        return false;
      });
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

        await Promise.all([this.loadMembers(), this.loadHyloGroup()]);
      } catch (e) {
        console.log('something went wrong:', e);
      } finally {
        this.isLoadingGroup = false;
      }
    }
  },
};
</script>

<style scoped>
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}
</style>
