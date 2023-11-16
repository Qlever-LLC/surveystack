<template>
  <div>
    <a-dialog v-model="show" max-width="350">
      <v-card class="pa-4" dark color="red">
        <v-card-title class="headline">{{ title }}</v-card-title>
        <template v-for="(error, idx) in errors">
          <div :key="'error_' + idx">
            <v-card-text
              ><span style="font-weight: bold">{{ error.title }}</span> {{ error.body }}
            </v-card-text>
          </div>
        </template>
      </v-card>
    </a-dialog>
  </div>
</template>

<script>
import ADialog from '@/components/ui/ADialog.vue';

export default {
  components: {
    ADialog,
  },
  props: {
    value: Boolean,
    errors: Array,
    title: String,
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
