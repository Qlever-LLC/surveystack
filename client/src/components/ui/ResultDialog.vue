<template>
  <div>
    <v-dialog v-model="show" max-width="350" :persistent="persistent">
      <v-card>
        <v-card-title v-if="title" class="headline mb-2">{{ title }}</v-card-title>

        <v-card-text>
          <div v-for="(item, idx) in messages" :key="idx">
            <v-card flat dark outlined class="mb-2" :color="item.error ? 'red darken-4' : 'green'">
              <v-card-text class="white--text">
                <span style="font-weight: bold">{{ item.title }}</span> {{ item.body }}
              </v-card-text>
              <template v-if="item.logs && item.logs.length">
                <v-divider class="mx-4"></v-divider>
                <v-dialog width="500">
                  <template v-slot:activator="{ on, attrs }">
                    <v-card-actions>
                      <v-spacer />
                      <v-btn text v-bind="attrs" v-on="on"> Logs </v-btn>
                    </v-card-actions>
                  </template>

                  <v-card>
                    <v-card-title>
                      Handler logs
                      <v-spacer></v-spacer>
                      <copy-to-clipboard :value="JSON.stringify(item.logs, null, 2)" />
                    </v-card-title>

                    <v-card-text>
                      <v-expansion-panels accordion>
                        <v-expansion-panel
                          v-for="(item, i) in item.logs.filter(Boolean)"
                          :key="i"
                          :readonly="!item.data"
                        >
                          <v-expansion-panel-header>
                            <template v-slot:actions v-if="!item.data"><v-spacer></v-spacer> </template>
                            <div class="mr-4 flex-grow-0">
                              <v-icon v-if="item.type === 'error'" color="error"> mdi-alert-circle </v-icon>
                              <v-icon v-else-if="item.type === 'success'" color="teal"> mdi-check </v-icon>
                              <v-icon v-else-if="item.type === 'info'" color="light-blue"> mdi-information </v-icon>
                              <v-icon v-else-if="item.type === 'warning'" color="orange"> mdi-alert </v-icon>
                              <v-icon v-else color="primary"> $expand </v-icon>
                            </div>
                            {{ item.message }}
                          </v-expansion-panel-header>
                          <v-expansion-panel-content>
                            <pre>{{ JSON.stringify(item.data, (k, v) => (v === undefined ? null : v), 2) }}</pre>
                          </v-expansion-panel-content>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </v-card-text>
                  </v-card>
                </v-dialog>
              </template>
              <!-- <pre v-if="item.logs">{{ JSON.stringify(item.logs, null, 2) }}</pre> -->
            </v-card>
          </div>
          <div v-if="additionalMessage" class="px-2" v-html="additionalMessage" />

          <div v-if="survey && submission" class="mt-6 d-flex flex-column align-stretch">
            <v-btn color="primary" depressed dense :loading="download.loading" @click="downloadSubmission">
              Download Submission
            </v-btn>
            <v-btn class="mt-3" color="primary" depressed dense :loading="emailing.loading" @click="emailMe">
              Email Submission
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="onClose"> Ok </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';

export default {
  props: {
    value: {
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    title: String,
    persistent: {
      type: Boolean,
      default: false,
    },
    additionalMessage: {
      type: String,
    },
    submission: {
      type: Object,
      default: () => null,
    },
    survey: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    download: {
      loading: false,
      error: null,
    },
    emailing: {
      loading: false,
      error: null,
    },
  }),
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
    messages() {
      const items = [...this.items];

      if (this.download.error) {
        items.push(this.download.error);
      }
      if (this.emailing.error) {
        items.push(this.emailing.error);
      }

      return items;
    },
    hasError() {
      return this.items.some((item) => item.error);
    },
  },
  methods: {
    async downloadSubmission() {
      this.download.loading = true;
      this.download.error = null;

      try {
        let res = null;
        if (this.hasError) {
          // If there's error while submitting a submission, we post submission and survey object
          // to generate PDF. There's a requirement to allow download PDF in such a failure case.

          if (this.submission.meta.submitAsUser) {
            this.submission.meta.creator = this.submission.meta.submitAsUser._id;
          }
          res = await api.post(`/submissions/pdf?base64=1`, {
            survey: this.survey,
            submission: this.submission,
          });
        } else {
          // Otherwise, download PDF normally (with submission ID in the backend side)

          res = await api.get(`/submissions/${this.submission._id}/pdf?base64=1`);
        }

        if (res) {
          const disposition = parseDisposition(res.headers['content-disposition']);
          downloadExternal(res.data, disposition.parameters.filename);
        }
      } catch (e) {
        console.error('Failed to download PDF of submission', e);
        this.download.error = {
          title: 'Error',
          body: 'Sorry, something went wrong while downloading your survey PDF. Please try again later.',
          error: true,
        };
      } finally {
        this.download.loading = false;
      }
    },
    async emailMe() {
      this.emailing.loading = true;
      this.emailing.error = null;

      try {
        await api.post(`/submissions/${this.submission._id}/send-email`);
      } catch (e) {
        console.error('Failed to email a survey', e);
        this.emailing.error = {
          title: 'Error',
          body: 'Sorry, something went wrong while sending the email. Please try again later.',
          error: true,
        };
      } finally {
        this.emailing.loading = false;
      }
    },
    onClose() {
      this.show = null;
      this.$emit('close');
      if (!this.persistent) {
        return;
      }
      this.$router.back();
    },
  },
};
</script>
