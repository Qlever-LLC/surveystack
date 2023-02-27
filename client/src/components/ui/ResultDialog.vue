<template>
  <div>
    <v-dialog v-model="show" max-width="350" :persistent="persistent">
      <v-card>
        <v-card-title v-if="title" class="headline mb-2">{{ title }}</v-card-title>

        <v-card-text>
          <div v-for="(item, idx) in items" :key="idx">
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

          <div v-if="isSuccess" class="mt-6 d-flex flex-column align-stretch">
            <v-btn color="primary" depressed dense @click="$emit('download')">Download</v-btn>
            <v-btn class="mt-3" color="primary" depressed dense @click="$emit('emailMe')">Email me survey</v-btn>
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
import CopyToClipboard from '../submissions/CopyToClipboard.vue';

export default {
  components: {
    CopyToClipboard,
  },
  props: {
    value: {
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
      validator: (item) => item.every(({ title, body }) => !!title && !!body),
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
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
    isSuccess() {
      return this.items.every((item) => !item.error);
    },
  },
  methods: {
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
