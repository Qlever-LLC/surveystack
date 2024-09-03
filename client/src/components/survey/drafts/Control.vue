<template>
  <div :class="className" style="width: 100%">
    <div v-if="control.type === 'page' && !insidePage">
      <div v-for="(child, i) in control.children" :key="i">
        <app-control
          :path="`${path}.${child.name}`"
          :control="child"
          :autoFocus="i === 0"
          :forceMobile="forceMobile"
          insidePage
          :isInBuilder="isInBuilder" />
      </div>
    </div>

    <div v-else-if="control.type === 'group' && insidePage">
      <div
        class="group"
        :class="{
          irrelevant: !store.getters['draft/relevance'](path),
          hidden: !store.getters['draft/relevance'](path) && insidePage,
        }">
        <app-control-label :value="control.label" :redacted="control.options && control.options.redacted" />
        <app-control-hint :value="control.hint" />

        <div v-for="(child, i) in control.children" :key="i">
          <app-control
            :path="`${path}.${child.name}`"
            :control="child"
            :autoFocus="autoFocus && i === 0"
            :forceMobile="forceMobile"
            insidePage
            :isInBuilder="isInBuilder" />
        </div>

        <app-control-more-info :value="control.moreInfo" />
      </div>
    </div>

    <div v-else>
      <div
        class="control"
        :class="{
          irrelevant: !store.getters['draft/relevance'](path),
          hidden: !store.getters['draft/relevance'](path) && insidePage,
        }">
        <component
          :is="getComponentName(control)"
          :control="control"
          :modelValue="value"
          :index="path"
          :key="path"
          :resources="survey.resources"
          @update:modelValue="setProperty"
          :meta="meta"
          :submission="submission"
          @setStatus="setStatus"
          @setContext="setContext"
          @setRenderQueue="setRenderQueue"
          :autoFocus="autoFocus"
          :relevant="store.getters['draft/relevance'](path)"
          @next="!store.getters['draft/hasRequiredUnanswered'] && store.dispatch('draft/next')"
          :redacted="control.options && control.options.redacted"
          :required="store.getters['draft/relevance'](path) && control.options && control.options.required"
          :forceMobile="forceMobile"
          :isInBuilder="isInBuilder"
          @initialize="initialize(control.id)" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-control',
};
</script>

<script setup>
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useQueryClient } from '@tanstack/vue-query';

const store = useStore();
const queryClient = useQueryClient();

const props = defineProps({
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
});

const state = reactive({
  once: false,
});

const className = computed(() => {
  return {
    'mx-0 px-0': true,
    'compact-page': props.control.type === 'page' && props.control.options.compact,
  };
});
const submission = computed(() => {
  return store.getters['draft/submission'];
});
const survey = computed(() => {
  return store.getters['draft/survey'];
});
const meta = computed(() => {
  return store.getters['draft/property'](`${props.path}.meta`);
});
const value = computed(() => {
  const property = store.getters['draft/property'](props.path);
  return property ? property.value : null;
});

function setProperty(value) {
  const path = `${props.path}.value`;
  // adjust modified date of the control
  const modified = new Date().toISOString();
  store.dispatch('draft/setProperty', {
    path: `${props.path}.meta.dateModified`,
    value: modified,
    calculate: false,
    initialize: false,
  });
  // adjust modified date of the submission
  store.dispatch('draft/setProperty', {
    path: 'meta.dateModified',
    value: modified,
    calculate: false,
    initialize: false,
  });
  // adjust value
  store.dispatch('draft/setProperty', { path, value });
  if (!state.once) {
    state.once = true;
    queryClient.invalidateQueries({ queryKey: ['localDrafts'] });
  }
}
function setStatus({ type, message }) {
  store.dispatch('draft/setProperty', { path: `${props.path}.meta.status`, value: type });
  store.dispatch('draft/setProperty', { path: `${props.path}.meta.statusMessage`, value: message });
}
function setContext(context) {
  store.dispatch('draft/setProperty', { path: `${props.path}.meta.context`, value: context });
}
function setRenderQueue(renderQueue) {
  store.dispatch('draft/setProperty', { path: `${props.path}.meta.renderQueue`, value: renderQueue });
}
function getComponentName(control) {
  return `app-control-${control.type}`;
}
function initialize(controlId) {
  //get the control's node
  const node = store.getters['draft/nodeByControl'](controlId);
  //force initialize
  store.dispatch('draft/initializeForced', node);
}
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

<style scoped lang="scss">
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
  border-left: 4px solid rgb(var(--v-theme-focus));
}

.group {
  margin: 8px 0px;
  padding: 1rem;
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid #fff;
  transition: 0.2s;
  background-color: #ffffff;
}

.group:first-child {
  margin-top: 0px;
}

.group:hover {
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2);
  border-left: 4px solid rgb(var(--v-theme-primary));
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
