<template>
  <div>
    <v-dialog v-model="show" max-width="350" :persistent="persistent">
      <v-card class="pa-4">
        <v-card-title class="headline">{{ title }}</v-card-title>
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
          <v-btn text color="primary" :to="persistent ? to : null" @click="show = null">
            Ok
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    value: Boolean,
    items: Array,
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
};
</script>
