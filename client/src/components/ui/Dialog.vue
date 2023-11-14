<template>
  <v-dialog v-model="show" :width="width" :max-width="maxWidth" :persistent="modal" v-bind="$attrs">
    <a-card>
      <a-card-title class="headline">
        <slot name="title">{{ title }}</slot>
      </a-card-title>
      <a-card-text>
        <slot name="default">Default slot content</slot>
      </a-card-text>
      <a-card-actions>
        <v-spacer />
        <v-btn v-if="!hideCancel" text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn text @click="$emit('confirm')">{{ labelConfirm ? labelConfirm : 'OK' }}</v-btn>
      </a-card-actions>
    </a-card>
  </v-dialog>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
import ACardActions from '@/components/ui/ACardActions.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardActions,
    ACardText,
    ACardTitle,
  },
  props: {
    modal: {
      type: Boolean,
      default: false,
    },
    value: Boolean,
    labelConfirm: String,
    width: [String, Number],
    title: {
      type: String,
      default: 'Dialog title',
    },
    maxWidth: {
      type: [String, Number],
      default: '',
    },
    hideCancel: {
      type: Boolean,
      default: false,
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
};
</script>
