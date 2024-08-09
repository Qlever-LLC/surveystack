<template>
  <a-dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" width="400">
    <a-card>
      <a-card-title> Confirm Submission </a-card-title>
      <a-card-text v-if="!isLoggedIn"> Submit Survey </a-card-text>
      <a-card-text v-else>
        Submit this draft <strong>{{ id }}</strong> to <br />
        <strong v-if="groupName">{{ groupName }}</strong>
        <strong v-else>no group</strong>
        <div v-if="submitAsUser">
          As user: <strong>{{ submitAsUser.name }}</strong> ({{ submitAsUser.email }})
        </div>
        <div v-if="isResubmission()">
          This submission was previously submitted on
          {{ new Date(dateSubmitted).toLocaleString() }}. Resubmission will archive the previous submission.
        </div>
        <div v-if="additionalMessage">
          {{ additionalMessage }}
        </div>
      </a-card-text>
      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click.stop="handleAbort"> Cancel </a-btn>
        <a-btn variant="text" color="primary" @click.stop="handleConfirm"> Submit </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import { getGroupNameById } from '@/utils/groups';

export default {
  data() {
    return {
      groupName: null,
      isLoggedIn: false,
    };
  },
  props: {
    modelValue: {
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
    isDraft: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue', 'submit', 'close', 'set-group'],
  created() {
    if (this.groupId) {
      getGroupNameById(this.groupId).then((response) => (this.groupName = response));
    }
    if (this.$store.getters['auth/isLoggedIn']) {
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }
  },
  computed: {},
  methods: {
    isResubmission() {
      return this.isDraft === false && this.dateSubmitted;
    },
    handleConfirm() {
      this.$emit('update:modelValue', false);
      this.$emit('submit');
      this.$emit('close', { done: false });
    },
    handleAbort() {
      this.$emit('update:modelValue', false);
      this.$emit('close', { done: true });
    },
    async setGroup(v) {
      await getGroupNameById(v).then((response) => (this.groupName = response));
      this.$emit('set-group', v);
    },
  },
};
</script>
