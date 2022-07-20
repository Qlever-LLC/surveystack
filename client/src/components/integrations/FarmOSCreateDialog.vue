<template>
  <v-dialog v-model="show" max-width="800" max-height="1000" @input="(v) => v || (testValue = [])">
    <v-card class="pa-4">
      <FarmOSRegister :viewModel="viewModel"></FarmOSRegister>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref } from '@vue/composition-api';
import FarmOSRegister from '@/pages/farmos-manage/FarmOSRegister.vue';

export default {
  emits: ['create'],
  props: {
    value: Boolean,
    groupId: {
      type: String,
      required: true,
    },
    plans: {
      type: Array,
      required: true,
    },
  },
  setup(props, { emit }) {
    console.log('dialog created');
    const viewModel = ref({
      form: {
        groupId: null,
        instanceName: '',
        instanceNameValid: null,
        email: '',
        fullName: '',
        farmName: '',
        farmAddress: '',
        units: '',
        timezone: '',
        agree: false,
        owner: null,
        fields: [],
        plan: null,
      },
      groups: [],
      plans: props.plans,
      users: [],
      count: 1,
    });

    const testValue = ref([]);
    return {
      testValue,
      viewModel,
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
