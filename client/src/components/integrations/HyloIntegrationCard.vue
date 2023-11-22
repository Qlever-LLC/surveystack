<template>
  <div>
    <v-card>
      <v-card-text v-if="isLoading">
        <v-card-title> Hylo Integraton </v-card-title>
        <a-spacer />
        <a-skeleton-loader type="list-item-avatar, card-heading" />
      </v-card-text>
      <template v-else-if="integratedHyloGroup">
        <a-img
          gradient="rgb(42, 64, 89), rgba(42, 64, 89, 0.2) 0px, rgba(42, 64, 89, 0.5)"
          height="250"
          :src="integratedHyloGroup.bannerUrl"
        >
          <v-app-bar flat color="rgba(0, 0, 0, 0)">
            <a-toolbar-title class="text-h6 white--text pl-0"> Hylo Integration </a-toolbar-title>

            <a-spacer />
            <v-dialog v-model="isRemoveConfirmDialogOpen" max-width="490">
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on" color="white"> Remove integration </v-btn>
              </template>
              <v-card>
                <v-card-title class="text-h5"> Are you sure? </v-card-title>
                <v-card-actions>
                  <a-spacer />
                  <v-btn
                    color="green darken-1"
                    text
                    @click="removeGroupIntegration"
                    :loading="isRemoveGroupIntegrationInProgress"
                  >
                    Yes, remove Hylo integration
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-app-bar>
          <a-spacer />

          <v-card-title class="white--text mt-8">
            <a-avatar size="56">
              <img alt="group" :src="integratedHyloGroup.avatarUrl" />
            </a-avatar>
            <v-col class="ml-3"
              ><p class="text-h5 mb-1">{{ integratedHyloGroup.name }}</p>

              <p class="text-subtitle-2 mb-0">{{ integratedHyloGroup.location }}</p></v-col
            >
          </v-card-title>

          <!-- <v-col class="hidden-xs-only" sm="5" md="3"> -->
          <v-card-text class="white--text">
            &nbsp;Your group is integrated with
            <a :href="integratedHyloGroup.hyloUrl" target="_blank">{{ integratedHyloGroup.name }}</a>
            on Hylo
          </v-card-text>

          <!-- </v-col> -->
        </a-img>
      </template>

      <template v-else>
        <v-card-title> Hylo Integraton </v-card-title>
        <a-spacer />
        <v-card-subtitle>This group is not integrated with Hylo yet</v-card-subtitle>

        <v-card-text>
          <v-dialog v-model="integrateDialog" width="500">
            <template v-slot:activator="{ on, attrs }">
              <v-btn color="primary" dark v-bind="attrs" v-on="on"> Integrate with Hylo </v-btn>
            </template>

            <v-card>
              <v-card-title>Integrate group with Hylo</v-card-title>

              <v-card-text>
                <div class="font-italic text-body-2 mb-4">Find an existing group on Hylo</div>
                <a-text-field
                  v-model="hyloGroupInput"
                  label="Hylo group"
                  placeholder="Link to your Hylo group"
                  :loading="isLoadingHyloGroup"
                  :error-messages="findError"
                  class="mb-2"
                />
                <v-col align="center">
                  <v-btn
                    color="primary"
                    :disabled="!groupFound || isCreateIntegratedHyloGroupInProgress"
                    :loading="isSetIntegratedInProgress"
                    @click="setIntegratedGroup"
                  >
                    {{ groupFound ? `Integrate with ${groupFound.name} on Hylo` : 'Integrate with Hylo' }}
                  </v-btn>
                </v-col>
                <a-row align="center" class="my-5">
                  <a-divider /><span class="mx-2">or</span>
                  <a-divider />
                </a-row>

                <div class="font-italic text-body-2 mb-4">Create a new group on Hylo with the same name</div>

                <v-col align="center">
                  <v-btn
                    color="primary"
                    :loading="isCreateIntegratedHyloGroupInProgress"
                    :disabled="isSetIntegratedInProgress"
                    @click="createIntegratedHyloGroup"
                  >
                    Integrate with a new Hylo group
                  </v-btn></v-col
                >
                <div class="font-italic text-body-2 mb-4">
                  Default group settings are: anyone can find and see this group but people must apply to join this
                  group and must be approved. You can change the settings in this Group Settings page in Hylo.
                </div>
              </v-card-text>

              <v-card-actions>
                <a-spacer />
                <v-btn text @click="integrateDialog = false"> close </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-text>
      </template>
    </v-card>
  </div>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';
import ARow from '@/components/ui/ARow.vue';

export default {
  components: {
    ARow,
  },
  props: {
    groupId: String,
  },
  data() {
    return {
      integratedHyloGroup: null,
      isLoading: true,
      isLoadingHyloGroup: false,
      isSetIntegratedInProgress: false,
      isRemoveGroupIntegrationInProgress: false,
      isRemoveConfirmDialogOpen: false,
      isCreateIntegratedHyloGroupInProgress: false,
      hyloGroupInput: null,
      integrateDialog: false,
      groupFound: null,
      findError: null,
    };
  },
  computed: {
    extractedSlug() {
      if (!this.hyloGroupInput) {
        return null;
      }
      const match = this.hyloGroupInput.match(/\/groups\/([^/]+)/);
      const slug = match ? match[1] : this.hyloGroupInput;
      return slug;
    },
  },
  watch: {
    extractedSlug(slug) {
      this.throttledFindHyloGroup(slug);
    },
    groupId: {
      immediate: true,
      // TODO find out how this should be done in Vue
      async handler(groupId) {
        this.isLoading = true;
        try {
          this.integratedHyloGroup = (await api.get(`/hylo/integrated-group/${groupId}`)).data;
        } catch (e) {
          console.error(e);
        } finally {
          this.isLoading = false;
        }
      },
    },
  },
  methods: {
    async setIntegratedGroup() {
      this.isSetIntegratedInProgress = true;
      try {
        this.integratedHyloGroup = (
          await api.post(`/hylo/set-integrated-group`, {
            hyloGroupId: this.groupFound.id,
            groupId: this.groupId,
          })
        ).data;
        this.integrateDialog = false;
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isSetIntegratedInProgress = false;
      }
    },
    async createIntegratedHyloGroup() {
      this.isCreateIntegratedHyloGroupInProgress = true;
      try {
        this.integratedHyloGroup = (
          await api.post(`/hylo/create-new-integrated-group`, {
            groupId: this.groupId,
          })
        ).data;
        this.integrateDialog = false;
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isCreateIntegratedHyloGroupInProgress = false;
      }
    },
    async removeGroupIntegration() {
      this.isRemoveGroupIntegrationInProgress = true;
      try {
        await api.post(`/hylo/remove-group-integration`, {
          groupId: this.groupId,
        });
        this.integratedHyloGroup = null;
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isRemoveGroupIntegrationInProgress = false;
        this.isRemoveConfirmDialogOpen = false;
      }
    },
    async throttledFindHyloGroup(slug) {
      if (this.isLoadingHyloGroup) {
        this._nextSlugToCheck = slug;
        return;
      }

      if (slug) {
        try {
          this.findError = null;
          this.groupFound = null;
          this.isLoadingHyloGroup = true;
          this.groupFound = (await api.get(`/hylo/group?slug=${slug}`)).data;
          this.findError = this.groupFound ? null : `Can't find Hylo group with slug "${slug}"`;
        } catch (e) {
          console.warn(e);
        }

        this.isLoadingHyloGroup = null;
        if (this._nextSlugToCheck) {
          const nextSlug = this._nextSlugToCheck;
          this._nextSlugToCheck = null;
          this.throttledFindHyloGroup(nextSlug);
        }
      }
    },
  },
};
</script>
