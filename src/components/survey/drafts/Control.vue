<template>
  <v-container class="mx-0 px-0 my-2">
    <div v-if="control.type === 'page' && !insidePage">
      <div
        v-for="(child, i) in control.children"
        :key="i"
      >
        <app-control
          :path="`${path}.${child.name}`"
          :control="child"
          :autoFocus="i===0"
          insidePage
        />
      </div>
    </div>

    <div v-else-if="control.type === 'group' && insidePage">
      <div
        class="group"
        :class="{irrelevant: !$store.getters['draft/relevance'](path)}"
      >
        <div class="d-flex justify-end">
          <h3 class="mr-auto">{{control.label}}</h3>
          <app-indicator
            :icon="'mdi-pencil-off'"
            v-if="!$store.getters['draft/relevance'](path)"
          >irrelevant</app-indicator>
          <app-indicator
            :icon="'mdi-asterisk'"
            v-if="control.options && control.options.required"
            color="red darken-2"
          >required</app-indicator>
        </div>

        <div
          v-for="(child, i) in control.children"
          :key="i"
        >
          <app-control
            :path="`${path}.${child.name}`"
            :control="child"
            :autoFocus="autoFocus && i===0"
            insidePage
          />
        </div>
      </div>
    </div>

    <div v-else>
      <div
        class="control"
        :class="{irrelevant: !$store.getters['draft/relevance'](path)}"
      >
        <div class="d-flex justify-end">
          <app-indicator
            :icon="'mdi-pencil-off'"
            v-if="!$store.getters['draft/relevance'](path)"
          >irrelevant</app-indicator>
          <app-indicator
            :icon="'mdi-asterisk'"
            v-if="control.options && control.options.required"
            color="red darken-2"
          >required</app-indicator>
        </div>
        <component
          :is="getComponentName(control)"
          :control="control"
          :value="$store.getters['draft/property'](path).value"
          :index="path"
          :key="path"
          :resources="survey.resources"
          @changed="setProperty"
          :meta="meta"
          :submission="submission"
          @setStatus="setStatus"
          @setContext="setContext"
          @setRenderQueue="setRenderQueue"
          :autoFocus="autoFocus"
          :relevant="$store.getters['draft/relevance'](path)"
          @next="$store.dispatch('draft/next')"
        />
      </div>

    </div>

  </v-container>
</template>

<script>
import moment from 'moment';
import appIndicator from '@/components/survey/drafts/Indicator.vue';

export default {
  name: 'app-control',
  components: {
    appIndicator,
  },
  props: {
    path: {
      type: String,
    },
    control: {
      type: Object,
    },
    insidePage: {
      type: Boolean,
      default: false,
    },
    autoFocus: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    submission() {
      return this.$store.getters['draft/submission'];
    },
    survey() {
      return this.$store.getters['draft/survey'];
    },
    meta() {
      return this.$store.getters['draft/property'](`${this.path}.meta`);
    },
  },
  methods: {
    setProperty(value) {
      const path = `${this.path}.value`;
      this.$store.dispatch('draft/setProperty', { path, value });

      // adjust modified date
      const modified = moment().toISOString(true);
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.dateModified`, value: modified, calculate: false });
      this.$store.dispatch('draft/setProperty', { path: 'meta.dateModified', value: modified, calculate: false });
    },
    setStatus({ type, message }) {
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.status`, value: type });
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.statusMessage`, value: message });
    },
    setContext(context) {
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.context`, value: context });
    },
    setRenderQueue(renderQueue) {
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.renderQueue`, value: renderQueue });
    },
    getComponentName(control) {
      return `app-control-${control.type}`;
    },
  },
};
</script>

<style scoped>
.control {
  border: 1px solid var(--v-primary-base);
  padding: 1rem;
  border-radius: 0.25rem;
}

.group {
  border: 1px solid var(--v-primary-base);
  padding: 1rem;
  border-radius: 0.25rem;
}

.irrelevant {
  opacity: 0.8;
  border: 1px solid #aaa;
}
</style>
