<template>
  <v-dialog v-if="drafts.length > 0" v-model="isOpen" max-width="400">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" color="red lighten-2" :disabled="disabled" :loading="isLoading" dark v-on="on">
        Delete drafts ({{ drafts.length }})
      </v-btn>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-title> Delete Drafts </v-card-title>

      <v-card-text class="pt-0"> This action cannot be undone. Are you sure you want to delete? </v-card-text>

      <v-spacer></v-spacer>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click.stop="isOpen = false"> Cancel </v-btn>
        <v-btn text color="red" @click.stop="handleDeleteDrafts"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  props: {
    drafts: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change'],
  setup(props, { root, emit }) {
    const isOpen = ref(false);
    const isLoading = ref(false);

    const handleDeleteDrafts = async () => {
      isOpen.value = false;
      isLoading.value = true;
      const ids = props.drafts.map((item) => item._id);
      await root.$store.dispatch('submissions/deleteDrafts', ids);
      isLoading.value = false;
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      isOpen,
      isLoading,
      handleDeleteDrafts,
    };
  },
});
</script>
