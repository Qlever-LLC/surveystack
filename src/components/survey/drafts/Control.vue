<template>
  <v-container>
    <div class="overline my-2">{{path}}</div>

    <div v-if="control.type === 'page'">
      <div
        v-for="(child, i) in control.children"
        :key="i"
      >
        <app-control
          :path="`${path}.${child.name}`"
          :control="child"
          :autoFocus="i===0"
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
        @changed="setProperty"
        :autoFocus="autoFocus"
      />

    </div>

  </v-container>
</template>

<script>
export default {
  name: 'app-control',
  props: {
    path: {
      type: String,
    },
    control: {
      type: Object,
    },
    autoFocus: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    setProperty(value) {
      const path = `${this.path}.value`;
      this.$store.dispatch('draft/setProperty', { path, value });
    },
    getComponentName(control) {
      return `app-control-${control.type}`;
    },
  },
};
</script>
