<template>
  <div>
    <v-dialog v-model="show" max-width="350" :persistent="persistent">
      <v-card class="pa-4">
        <v-card-title class="headline" v-if="title">{{ title }}</v-card-title>
        <template v-for="(item, idx) in items">
          <div :key="'item_' + idx">
            <v-card flat dark outlined class="mb-2" :color="item.error ? 'red darken-4' : 'green'">
              <v-card-text class="white--text">
                <span style="font-weight: bold">{{ item.title }}</span> {{ item.body }}
              </v-card-text>
            </v-card>
          </div>
        </template>
        <div v-if="additionalMessage" v-html="additionalMessage" />
        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="onClose"> Ok </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
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
