<template>
  <v-dialog v-model="show" max-width="800" max-height="1000" @input="(v) => v">
    <v-card class="pa-4">
      <FarmOSRegister
        :viewModel="viewModel"
        @check-url="(f) => $emit('check-url', f)"
        @create-instance="(f) => $emit('create-instance', f)"
      ></FarmOSRegister>
    </v-card>
  </v-dialog>
</template>

<script>
import FarmOSRegister from '@/pages/farmos-manage/FarmOSRegister.vue';

export default {
  emits: ['create', 'createInstance', 'checkUrl'],
  props: {
    value: Boolean,
    viewModel: {
      type: Object,
      required: true,
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
  components: { FarmOSRegister },
};
</script>
