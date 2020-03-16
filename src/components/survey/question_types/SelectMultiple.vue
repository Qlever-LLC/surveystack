<template>
  <v-container fluid>
    <v-row>
      <v-list v-if="sourceIsValid">
        <v-label>{{control.label}}</v-label>
        <v-list-item-group
          :value="value || []"
          @change="onChange"
          multiple
        >
          <v-list-item
            v-for="(item) in control.options.source"
            :value="item.value"
            :key="item.value"
          >
            <template v-slot:default="{ active, toggle }">
              <v-list-item-content>
                <v-list-item-title v-text="item.value" />
              </v-list-item-content>

              <v-list-item-action>
                <v-checkbox
                  :input-value="active"
                  :true-value="item"
                  @click="toggle"
                />
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div v-else>
        Invalid Select Options, please update Suvey Definition
      </div>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    onChange(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
  },
  computed: {
    sourceIsValid() {
      return this.control.options.source
        && Array.isArray(this.control.options.source)
        && this.control.options.source.length > 0
        && this.control.options.source.every(({ label, value }) => label && value);
    },
  },
};
</script>

<style scoped>

</style>
