<template>
  <v-dialog :value="value" @input="$emit('input', $event)" width="400">
    <v-card>
      <v-card-title> Confirm Submission </v-card-title>
      <v-card-text v-if="!canEditGroup"> Submit Survey </v-card-text>
      <v-card-text v-else>
        Submit this draft <strong v-if="id">{{ id }}</strong> to
        <div v-if="isGroupEdit" class="d-inline-flex align-end">
          <active-group-selector v-model="group" label="Group" class="d-inline-block mb-2" />
          <v-btn icon @click="isGroupEdit = false"> <v-icon>mdi-close</v-icon> </v-btn>
        </div>
        <template v-else>
          <strong>{{ groupName || 'no group' }}</strong>
          <v-btn v-if="canEditGroup" icon @click="isGroupEdit = true"> <v-icon small>mdi-pencil</v-icon> </v-btn>
        </template>
        <p v-if="submitAsUser">
          As user: <strong>{{ submitAsUser.name }}</strong> ({{ submitAsUser.email }})
        </p>
        <p v-if="dateSubmitted">
          This submission was previously submitted on {{ new Date(dateSubmitted).toLocaleString() }}. Resubmission will
          archive the previous submission.
        </p>
        <div v-if="additionalMessage">
          {{ additionalMessage }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click.stop="handleAbort"> Cancel </v-btn>
        <v-btn text color="primary" @click.stop="handleConfirm"> Submit </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';
import { getGroupNameById } from '@/utils/groups';
import { computed, defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  components: {
    ActiveGroupSelector,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    groupId: {
      type: String,
      required: false,
    },
    submitAsUser: {
      type: Object,
      required: false,
    },
    'survey-name': {
      type: String,
    },
    additionalMessage: {
      type: String,
    },
    id: {
      type: String,
    },
    dateSubmitted: {
      type: String,
    },
  },
  emits: ['input', 'submit', 'close'],
  setup(props, { root, emit }) {
    const isGroupEdit = ref(false);
    const groupName = ref('');
    const canEditGroup = computed(() => root.$store.getters['auth/isLoggedIn']);

    const group = computed({
      get() {
        return props.groupId;
      },
      set(val) {
        setGroupName(val);
        emit('set-group', val);
      },
    });

    const handleConfirm = () => {
      emit('input', false);
      emit('submit');
      emit('close', { done: false });
    };

    const handleAbort = () => {
      emit('input', false);
      emit('close', { done: true });
    };

    const setGroupName = (groupId) => {
      if (groupId) {
        getGroupNameById(groupId).then((res) => (groupName.value = res));
      }
    };

    setGroupName(props.groupId);
    watch(() => props.groupId, setGroupName);

    return {
      isGroupEdit,
      groupName,
      canEditGroup,
      group,
      handleConfirm,
      handleAbort,
    };
  },
});
</script>
