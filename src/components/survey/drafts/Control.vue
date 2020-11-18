<template>
  <v-container class="mx-0 px-0">
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

    <div v-else>
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
        :relevant="$store.getters['draft/property'](`${path}.meta.relevant`, true)"
        @next="$store.dispatch('draft/next')"
      />

    </div>

  </v-container>
</template>

<script>
import moment from 'moment';

export default {
  name: 'app-control',
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
      this.$store.dispatch('draft/setProperty', { path: `${this.path}.meta.dateModified`, value: modified });
      this.$store.dispatch('draft/setProperty', { path: 'meta.dateModified', value: modified });
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
