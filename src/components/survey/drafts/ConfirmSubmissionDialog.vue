<template>
  <v-dialog
    :value="value"
    @input="(v) => $emit('input', v)"
    width="300"
  >
    <v-card>
      <v-card-title>
        Confirm Submission
      </v-card-title>
      <v-card-text v-if="!currentGroupName">
        Submit Survey
      </v-card-text>
      <v-card-text v-else>
        Submit this draft <strong>{{ id }}</strong> to
        <strong>{{ currentGroupName }}</strong>
        <div class="d-inline-flex align-end">
          <active-group-selector
            v-if="groupEditorIsVisible"
            label="Group"
            class="d-inline-block"
            :value="group"
            @input="setGroup"
          />
          <v-btn
            icon
            @click="handleEditGroup"
            v-if="!groupEditorIsVisible"
          >
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            @click="handleCloseGroupEditor"
            v-else
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div v-if="dateSubmitted">
          This submission was previously submitted on {{ new Date(dateSubmitted).toLocaleString() }}. Resubmission will archive the previous submission.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click.stop="handleAbort"
        >
          Cancel
        </v-btn>
        <v-btn
          text
          color="primary"
          @click.stop="handleConfirm"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';

export default {
  data() {
    return {
      groupEditorIsVisible: false,
    };
  },
  props: {
    value: {
      required: true,
      type: Boolean,
    },
    group: {
      required: false,
      type: String,
    },
    'survey-name': {
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
  computed: {
    groups() {
      return this.$store.getters['memberships/groups'];
    },
    currentGroupName() {
      if (!this.groups || this.groups.length === 0) {
        return null;
      }

      const { name } = this.groups.find(g => g._id === this.group);
      return name || this.group;
    },
  },
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
    setGroup(v) {
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

<style>
</style>
