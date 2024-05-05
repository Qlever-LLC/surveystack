<template>
  <div class="d-flex align-center control-label-wrapper" :class="className">
    <div class="control-label" v-if="value">{{ value }}</div>
    <a-spacer />
    <initialize-button
      v-if="initializable"
      bottom
      @initialize="$emit('initialize')"
      :highlight="isModified"
      :tooltip="initializeTooltip" />
    <app-redacted v-if="redacted" bottom />
    <app-required v-if="required" bottom />
  </div>
</template>

<script>
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';
import InitializeButton from '@/components/survey/drafts/InitializeButton';

export default {
  props: ['value', 'required', 'redacted', 'initializable', 'isModified', 'initializeTooltip'],
  components: {
    InitializeButton,
    appRequired,
    appRedacted,
  },
  computed: {
    className() {
      return {
        'margin-top-3': this.value,
        'mb-3': this.value || this.required || this.redacted,
        'mb-0': !this.value && !this.required && !this.redacted,
      };
    },
  },
};
</script>

<style>
.compact-page .control-label-wrapper.margin-top-3 {
  margin-top: 12px;
}
</style>

<style scoped lang="scss">
.control-label {
  font-size: 1.25rem;
  line-height: 2rem;
  font-weight: 500;
  letter-spacing: 0.0125em;
  padding: 0px 0px 0px 0px;
}
</style>
