<template>
  <div :class="className" style="width: 100%">
    <div v-if="control.type === 'page' && !insidePage">
      <div v-for="(child, i) in control.children" :key="i">
        <app-control :path="`${path}.${child.name}`" :control="child" :autoFocus="i === 0" insidePage />
      </div>
    </div>

    <div v-else-if="control.type === 'group' && insidePage">
      <div
        class="group"
        :class="{
          irrelevant: !$store.getters['draft/relevance'](path),
          hidden: !$store.getters['draft/relevance'](path) && insidePage,
        }"
      >
        <app-control-label :value="control.label" :redacted="control.options && control.options.redacted" />
        <app-control-hint :value="control.hint" />

        <div v-for="(child, i) in control.children" :key="i">
          <app-control :path="`${path}.${child.name}`" :control="child" :autoFocus="autoFocus && i === 0" insidePage />
        </div>

        <app-control-more-info :value="control.moreInfo" />
      </div>
    </div>

    <div v-else>
      <div
        class="control"
        :class="{
          irrelevant: !$store.getters['draft/relevance'](path),
          hidden: !$store.getters['draft/relevance'](path) && insidePage,
        }"
      >
        <component
          :is="getComponentName(control)"
          :control="control"
          :value="$store.getters['draft/property'](path) ? $store.getters['draft/property'](path).value : null"
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
          @next="!$store.getters['draft/hasRequiredUnanswered'] && $store.dispatch('draft/next')"
          :redacted="control.options && control.options.redacted"
          :required="$store.getters['draft/relevance'](path) && control.options && control.options.required"
          :forceMobile="forceMobile"
          :isInBuilder="isInBuilder"
        />
      </div>
    </div>
  </div>
</template>

<script>
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
    forceMobile: {
      type: Boolean,
      default: false,
    },
    isInBuilder: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    className() {
      return {
        'mx-0 px-0': true,
        'compact-page': this.control.type === 'page' && this.control.options.compact,
      };
    },
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
      const modified = new Date().toISOString();
      this.$store.dispatch('draft/setProperty', {
        path: `${this.path}.meta.dateModified`,
        value: modified,
        calculate: false,
      });
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

<style lang="scss">
.compact-page {
  .control {
    margin: 0px !important;
    padding: 0.5rem !important;
    box-shadow: none !important;

    .control-label-wrapper {
      margin-bottom: 4px !important;
      min-height: 16px;
    }

    .control-more-info {
      margin-top: 4px !important;
    }
  }

  & > div {
    margin-bottom: 0.5rem;
    box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);

    & > :first-child .control {
      padding-top: 1rem !important;
      margin-top: 8px !important;
    }

    & > :last-child .control {
      padding-bottom: 24px !important;
    }
  }
}
</style>

<style scoped>
.control {
  margin: 8px 0px;
  padding: 1rem;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid #fff;
  transition: 0.3s;
  background-color: #ffffff;
}

/* On mouse-over, add a deeper shadow */
.control:hover {
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid var(--v-focus-base);
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

.hidden {
  display: none;
}

.irrelevant:hover {
  border-left: 4px solid #aaa;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
}

.title {
  font-family: 'Google Sans', Roboto, Arial, sans-serif;
}
</style>
