<template>
  <a-container fluid>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <app-control-hint :value="control.hint" />

    <div v-for="child in control.children" :key="child.name">
      <component
        :is="`app-control-${child.type}`"
        :control="child"
        :value="child.value"
        :index="index"
        @changed="setValue"
      />
    </div>
    <app-control-more-info :value="control.moreInfo" />
  </a-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import AContainer from '@/components/ui/AContainer.vue';

export default {
  mixins: [baseQuestionComponent],
  components: {
    AContainer,
  },
  methods: {
    setValue(newValue) {
      console.log(newValue);
      this.$emit('changed', newValue);
    },
  },
};
</script>
