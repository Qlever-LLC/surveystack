<template>
  <div
    v-if="value || required || redacted"
    class="d-flex align-center mb-3"
  >
    <div
      class="control-label"
      v-if="value"
    >{{value}}</div>
    <v-spacer />
    <app-redacted v-if="redacted" />
    <app-required v-if="required" />
  </div>
</template>

<script>
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';

export default {
  props: ['value', 'required', 'redacted'],
  components: {
    appRequired,
    appRedacted,
  },
};
</script>

<style scoped>
.control-label {
  font-size: 1.25rem;
  line-height: 2rem;
  font-weight: 500;
  letter-spacing: 0.0125em;
  padding: 0px 0px 0px 0px;
}
</style>
