<template>
  <v-container>
    {{path}}

    <div v-if="control.type === 'page'">
      <div
        v-for="(child, i) in control.children"
        :key="i"
      >
        <app-control
          :path="`${path}.${child.name}`"
          :control="child"
        />
      </div>
    </div>

    <div v-else>
      <v-text-field
        :label="path"
        :value="$store.getters['draft/property'](path).value"
        @input="setProperty"
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
  },
  methods: {
    setProperty(value) {
      const path = `${this.path}.value`;
      this.$store.dispatch('draft/setProperty', { path, value });
    },
  },
};
</script>
