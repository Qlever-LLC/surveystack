<template>
  <v-dialog v-model="show" max-width="800" max-height="1000" @input="(v) => v || clearViewModel()">
    <v-card class="pa-4">
      <FarmOSRegister
        :viewModel="localViewModel"
        @check-url="(f) => $emit('checkUrl', f)"
        @create-instance="(f) => $emit('createInstance', f)"
      ></FarmOSRegister>
    </v-card>
  </v-dialog>
</template>

<script>
import _ from 'lodash';
import { ref } from '@vue/composition-api';
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
  setup(props, { emit }) {
    const localViewModel = ref(_.cloneDeep(props.viewModel));

    const clearViewModel = () => {
      localViewModel.value = _.cloneDeep(props.viewModel);
    };

    return {
      localViewModel,
      clearViewModel,
    };
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
