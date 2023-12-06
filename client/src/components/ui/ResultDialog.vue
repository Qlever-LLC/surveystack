<template>
  <div>
    <a-dialog v-model="show" max-width="350" :persistent="persistent">
      <a-card>
        <a-card-title v-if="title" class="headline mb-2">{{ title }}</a-card-title>

        <a-card-text>
          <div v-for="(item, idx) in messages" :key="idx">
            <a-card theme="dark" variant="outlined" class="mb-2" :color="item.error ? 'red-darken-4' : 'green'">
              <a-card-text class="text-white">
                <span style="font-weight: bold">{{ item.title }}</span> {{ item.body }}
              </a-card-text>
              <template v-if="item.logs && item.logs.length">
                <a-divider class="mx-4" />
                <a-dialog width="500">
                  <template v-slot:activator="{ on, attrs }">
                    <a-card-actions>
                      <a-spacer />
                      <a-btn variant="text" v-bind="attrs" v-on="on"> Logs </a-btn>
                    </a-card-actions>
                  </template>

                  <a-card>
                    <a-card-title>
                      Handler logs
                      <a-spacer />
                      <copy-to-clipboard :value="JSON.stringify(item.logs, null, 2)" />
                    </a-card-title>

                    <a-card-text>
                      <a-expansion-panels variant="accordion">
                        <a-expansion-panel
                          v-for="(item, i) in item.logs.filter(Boolean)"
                          :key="i"
                          :readonly="!item.data"
                        >
                          <a-expansion-panel-title>
                            <template v-slot:actions v-if="!item.data"><a-spacer /> </template>
                            <div class="mr-4 flex-grow-0">
                              <a-icon v-if="item.type === 'error'" color="error"> mdi-alert-circle </a-icon>
                              <a-icon v-else-if="item.type === 'success'" color="teal"> mdi-check </a-icon>
                              <a-icon v-else-if="item.type === 'info'" color="light-blue"> mdi-information </a-icon>
                              <a-icon v-else-if="item.type === 'warning'" color="orange"> mdi-alert </a-icon>
                              <a-icon v-else color="primary"> $expand </a-icon>
                            </div>
                            {{ item.message }}
                          </a-expansion-panel-title>
                          <a-expansion-panel-text>
                            <pre>{{ JSON.stringify(item.data, (k, v) => (v === undefined ? null : v), 2) }}</pre>
                          </a-expansion-panel-text>
                        </a-expansion-panel>
                      </a-expansion-panels>
                    </a-card-text>
                  </a-card>
                </a-dialog>
              </template>
              <!-- <pre v-if="item.logs">{{ JSON.stringify(item.logs, null, 2) }}</pre> -->
            </a-card>
          </div>
          <div v-if="additionalMessage" class="px-2" v-html="additionalMessage" />

          <div v-if="survey && submission && isOnline()" class="mt-6 d-flex flex-column align-stretch">
            <a-btn color="primary" variant="flat" dense :loading="download.loading" @click="downloadSubmission">
              Download Submission
            </a-btn>
            <a-btn class="mt-3" color="primary" variant="flat" dense :loading="emailing.loading" @click="emailMe">
              Email Submission
            </a-btn>
          </div>
        </a-card-text>

        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" color="primary" @click="onClose"> Ok </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
  </div>
</template>

<script>
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';
import { isOnline } from '@/utils/surveyStack';
import CopyToClipboard from '@/components/submissions/CopyToClipboard.vue';

export default {
  components: { CopyToClipboard },
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
    to: {
      type: Object,
      default: () => ({}),
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
    isOnline,
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
      this.$router.push(this.to);
    },
  },
};
</script>
