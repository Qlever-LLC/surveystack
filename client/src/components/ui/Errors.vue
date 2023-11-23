<template>
  <div>
    <a-dialog v-model="show" max-width="350">
      <a-card class="pa-4" dark color="red">
        <a-card-title class="headline">{{ title }}</a-card-title>
        <template v-for="(error, idx) in errors">
          <div :key="'error_' + idx">
            <a-card-text>
              <span style="font-weight: bold">{{ error.title }}</span> {{ error.body }}
            </a-card-text>
          </div>
        </template>
      </a-card>
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
