<template>
  <div>
    <v-card>
      <v-card-text v-if="isLoading">
        <v-card-title> Hylo Integraton </v-card-title>
        <v-spacer />
        <v-skeleton-loader type="list-item-avatar, card-heading"></v-skeleton-loader>
      </v-card-text>
      <template v-else-if="integratedHyloGroup">
        <v-img
          gradient="rgb(42, 64, 89), rgba(42, 64, 89, 0.2) 0px, rgba(42, 64, 89, 0.5)"
          height="250"
          :src="integratedHyloGroup.bannerUrl"
        >
          <v-app-bar flat color="rgba(0, 0, 0, 0)">
            <v-toolbar-title class="text-h6 white--text pl-0"> Hylo Integration </v-toolbar-title>

            <v-spacer></v-spacer>

            <v-btn text color="white" @click="removeGroupIntegration" :loading="isRemoveGroupIntegrationInProgress">
              Remove integration
            </v-btn>
          </v-app-bar>
          <v-spacer />
          <!-- <v-col cols="4" sm="2" md="1"> -->
          <!-- <v-avatar size="36px" class="mr-4">
              <img alt="Avatar" :src="integratedHyloGroup.avatarUrl" />
            </v-avatar> -->
          <!-- </v-col> -->

          <v-card-title class="white--text mt-8">
            <v-avatar size="56">
              <img alt="group" :src="integratedHyloGroup.avatarUrl" />
            </v-avatar>
            <v-col class="ml-3"
              ><p class="text-h5 mb-1">{{ integratedHyloGroup.name }}</p>

              <p class="text-subtitle-2 mb-0">{{ integratedHyloGroup.location }}</p></v-col
            >
          </v-card-title>

          <!-- <v-col class="hidden-xs-only" sm="5" md="3"> -->
          <v-card-text class="white--text">
            &nbsp;Your group is integrated with
            <a :href="`https://wwww.hylo.com/groups/${integratedHyloGroup.slug}`" target="_blank">{{
              integratedHyloGroup.name
            }}</a>
            on Hylo
          </v-card-text>

          <!-- </v-col> -->
        </v-img>
      </template>

      <template v-else>
        <v-card-title> Hylo Integraton </v-card-title>
        <v-spacer />
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
                <v-text-field
                  v-model="hyloGroupInput"
                  label="Hylo group"
                  placeholder="Link to your Hylo group"
                  :loading="!!isLoadingHyloGroup"
                  :error-messages="findError"
                  class="mb-2"
                ></v-text-field>
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
                <v-row align="center" class="my-5">
                  <v-divider></v-divider><span class="mx-2">or</span><v-divider></v-divider
                ></v-row>

                <div class="font-italic text-body-2 mb-4">Create a new group on Hylo with the same name</div>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-col align="center">
                      <v-btn
                        color="primary"
                        :loading="isCreateIntegratedHyloGroupInProgress"
                        :disabled="isSetIntegratedInProgress"
                        @click="createIntegratedHyloGroup"
                        v-bind="attrs"
                        v-on="on"
                      >
                        Integrate with a new Hylo group
                      </v-btn></v-col
                    >
                  </template>
                  <span>Create a new group on Hylo with the same name and connect it to this group</span>
                </v-tooltip>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
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

export default {
  props: {
    groupId: String,
  },
  data() {
    return {
      integratedHyloGroup: null,
      isLoading: true,
      isLoadingHyloGroup: null,
      isSetIntegratedInProgress: false,
      isRemoveGroupIntegrationInProgress: false,
      isCreateIntegratedHyloGroupInProgress: false,
      hyloGroupInput: null,
      integrateDialog: false,
      groupFound: null,
      findError: null,
    };
  },
  computed: {
    extractedSlug() {
      console.log('this.hyloGroupInput', this.hyloGroupInput);
      if (!this.hyloGroupInput) {
        return null;
      }
      const match = this.hyloGroupInput.match(/\/groups\/([^/]+)/);
      console.log({ match });
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
        console.log('this.groupId', groupId);
        this.integratedHyloGroup = (await api.get(`/hylo/integrated-group/${groupId}`)).data;
        console.log(JSON.stringify(this.integratedHyloGroup, null, 2));
        // TODO handle error
        this.isLoading = false;
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
      }
    },
    async throttledFindHyloGroup(slug) {
      console.log('throttledFindHyloGroup', slug, this.isLoadingHyloGroup);
      if (this.isLoadingHyloGroup) {
        this._nextSlugToCheck = slug;
        console.log('already loading, next is ', slug);
        return;
      }
      console.log('check with', slug);
      if (slug) {
        try {
          this.findError = null;
          this.groupFound = null;
          this.isLoadingHyloGroup = api.get(`/hylo/group?slug=${slug}`);
          this.groupFound = (await this.isLoadingHyloGroup).data;
          this.findError = this.groupFound ? null : `Can't find Hylo group with slug "${slug}"`;
        } catch (e) {
          console.warn(e);
        }

        this.isLoadingHyloGroup = null;
        console.log('this._nextSlugToCheck', this._nextSlugToCheck);
        if (this._nextSlugToCheck) {
          this.throttledFindHyloGroup(this._nextSlugToCheck);
          this._nextSlugToCheck = null;
        }
      }
    },
  },
};
</script>
