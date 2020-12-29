<template>
  <div
    class="mx-0 px-0 my-2"
    style="width: 100%"
  >
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
        <app-control-label
          :value="control.label"
          :redacted="control.options && control.options.redacted"
        />
        <app-control-hint :value="control.hint" />

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

        <app-control-more-info :value="control.moreInfo" />
      </div>
    </div>

    <div v-else>
      <div
        class="control"
        :class="{irrelevant: !$store.getters['draft/relevance'](path)}"
      >
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
          :redacted="control.options && control.options.redacted"
          :required="$store.getters['draft/relevance'](path) && control.options && control.options.required"
        />
      </div>

    </div>

  </div>
</template>

<script>
import moment from 'moment';
import appRequired from '@/components/survey/drafts/Required.vue';
import appRedacted from '@/components/survey/drafts/Redacted.vue';


export default {
  name: 'app-control',
  components: {
    appRequired,
    appRedacted,
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
  padding: 1rem;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid #fff;
  transition: 0.3s;
}

/* On mouse-over, add a deeper shadow */
.control:hover {
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid var(--v-primary-base);
}

.group {
  padding: 1rem;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid #fff;
  transition: 0.2s;
}

.group:hover {
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid var(--v-primary-base);
}

.irrelevant {
  opacity: 0.5;
  border-color: #aaa;
  border-left: 4px solid #aaa;
}

.irrelevant:hover {
  border-left: 4px solid #aaa;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
}

.title {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
}
</style>
