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
      <v-card-text>
        Submit this draft to
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
      required: true,
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
      const { name } = this.groups.find(g => g._id === this.group);
      return name || this.group;
    },
  },
  methods: {
    handleConfirm() {
      this.$emit('input', false);
      this.$emit('submit');
    },
    handleAbort() {
      this.$emit('input', false);
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
