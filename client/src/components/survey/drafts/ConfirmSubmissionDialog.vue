<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="400">
    <v-card>
      <v-card-title> Confirm Submission </v-card-title>
      <v-card-text v-if="!groupChangeAllowed"> Submit Survey </v-card-text>
      <v-card-text v-else>
        Submit this draft <strong>{{ id }}</strong> to
        <strong v-if="groupName">{{ groupName }}</strong>
        <strong v-else>no group</strong>
        <div class="d-inline-flex align-end" v-if="groupEditorIsVisible">
          <active-group-selector label="Group" class="d-inline-block" :value="groupId" @input="setGroup" />
          <v-btn icon @click="handleCloseGroupEditor">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-btn icon @click="handleEditGroup" v-if="groupChangeAllowed && !groupEditorIsVisible">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
        <div v-if="submitAsUser">
          As user: <strong>{{ submitAsUser.name }}</strong> ({{ submitAsUser.email }})
        </div>
        <div v-if="dateSubmitted">
          This submission was previously submitted on
          {{ new Date(dateSubmitted).toLocaleString() }}. Resubmission will archive the previous submission.
        </div>
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

export default {
  data() {
    return {
      groupEditorIsVisible: false,
      groupName: null,
      groupChangeAllowed: false,
    };
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
  components: {
    ActiveGroupSelector,
  },
  created() {
    if (this.groupId) {
      getGroupNameById(this.groupId).then((response) => (this.groupName = response));
    }
    if (this.$store.getters['auth/isLoggedIn']) {
      this.groupChangeAllowed = true;
    } else {
      this.groupChangeAllowed = false;
    }
  },
  computed: {},
  methods: {
    handleConfirm() {
      this.$emit('input', false);
      this.$emit('submit');
      this.$emit('close', { done: false });
    },
    handleAbort() {
      this.$emit('input', false);
      this.$emit('close', { done: true });
    },
    async setGroup(v) {
      await getGroupNameById(v).then((response) => (this.groupName = response));
      this.$emit('set-group', v);
    },
    handleEditGroup() {
      this.groupEditorIsVisible = true;
    },
    handleCloseGroupEditor() {
      this.groupEditorIsVisible = false;
    },
  },
};
</script>
