<template>
  <div>
    <form v-if="control">
      <div class="form-group">
        <label for="properties-name">Data name</label>
        <input class="form-control" v-model="control.name" id="properties-name" />
      </div>
      <div class="form-group">
        <label for="properties-label">Label</label>
        <input class="form-control" v-model="control.label" id="properties-label" />
      </div>
      <div v-if="!showAdvanced" class="d-flex justify-content-end">
        <small>
          <a
            @click.prevent="showAdvanced = true"
            href="./builder?showAdvanced=true"
          >show advanced...</a>
        </small>
      </div>
      <div v-if="showAdvanced" class="p-3 rounded border">
        <button type="button" class="close" aria-label="Close" @click.stop="showAdvanced = false">
          <span aria-hidden="true">&times;</span>
        </button>
        <h5>Advanced Options</h5>
        <div class="form-group">
          <label for="properties-label">Calculate</label>
          <input class="form-control" v-model="control.options.calculate" id="properties-label" />
        </div>

        <div class="form-group">
          <label for="properties-label">Show question if</label>
          <input class="form-control" v-model="control.options.relevance" id="properties-label" />
        </div>

        <div class="d-flex justify-content-end">
          <small>
            <a @click.prevent="openAdvancedEditor" href="./editor">open in editor...</a>
          </small>
        </div>
      </div>
    </form>
    <div v-else>...</div>
  </div>
</template>
<script>
import { getAdvancedCodeTemplate } from '@/utils/surveys';

export default {
  props: {
    control: {
      required: false,
    },
    survey: {
      required: true,
    },
  },
  data() {
    return {
      showAdvanced: false,
    };
  },
  methods: {
    openAdvancedEditor() {
      // TODO: can't pass params to new window
      // Use Vuex maybe?
      this.$router.push({
        name: 'debug-monaco',
        params: {
          initialCode: getAdvancedCodeTemplate(this.survey),
        },
      });
    },
  },
};
</script>
