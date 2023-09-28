<template>
  <v-dialog v-if="submissions.length > 0" v-model="isOpen" max-width="400">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" color="red lighten-2" dark :disabled="disabled" :loading="isLoading" v-on="on">
        Delete ({{ submissions.length }})
      </v-btn>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-title> Delete Submissions </v-card-title>

      <v-card-text class="pt-0">
        This will delete the selected submissions completely from your phone and the cloud. An organization you are part
        of may need this data. Are you sure?
      </v-card-text>

      <v-spacer></v-spacer>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" @click.stop="handleDeleteSubmissions"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  props: {
    submissions: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change'],
  setup(props, { root, emit }) {
    const isOpen = ref(false);
    const isLoading = ref(false);

    const handleDeleteSubmissions = async () => {
      isOpen.value = false;
      isLoading.value = true;
      const ids = props.submissions.map((item) => item._id);
      const success = await root.$store.dispatch('mySubmissions/deleteSubmissions', ids);
      isLoading.value = false;

      if (!success) {
        root.$store.dispatch(
          'feedback/add',
          `Something went wrong while deleting ${ids.length === 1 ? 'the submission' : ids.length + ' submissions'}.`
        );
      }
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      isOpen,
      isLoading,
      handleDeleteSubmissions,
    };
  },
});
</script>
