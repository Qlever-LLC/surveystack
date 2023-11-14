<template>
  <div>
    <v-form class="d-flex flex-column">
      <v-textarea v-model="value.match" outlined label="Match" rows="3" />
      <v-row>
        <a-col>
          <v-text-field v-model="value.sort" label="Sort" dense />
        </a-col>
        <a-col>
          <v-text-field v-model="value.project" label="Projection" dense />
        </a-col>
        <a-col cols="2">
          <v-text-field v-model.number="value.skip" label="Skip" dense />
        </a-col>
        <a-col cols="2">
          <v-text-field v-model.number="value.limit" label="Limit" dense />
        </a-col>
      </v-row>

      <v-row dense>
        <a-col>
          <v-checkbox label="Show irrelevant fields" v-model="value.showIrrelevant" class="my-0" hide-details />
        </a-col>
      </v-row>

      <v-row dense>
        <a-col>
          <v-checkbox label="Show data meta (CSV)" v-model="value.showCsvDataMeta" class="my-0" hide-details />
        </a-col>
      </v-row>

      <v-row v-if="showRolesDebug">
        <a-col cols="6">
          <v-text-field v-model.number="value.roles" label="Roles (Debug)" dense />
        </a-col>
      </v-row>

      <div class="d-flex justify-end">
        <v-btn class="ma-2" @click="$emit('show-advanced', false)" text>Basic</v-btn>
        <v-btn class="ma-2" outlined @click="$emit('reset')">Reset</v-btn>
        <v-btn class="ma-2" color="primary" @click="$emit('apply-advanced-filters')" :disabled="!validQuery"
          >Apply</v-btn
        >
      </div>
    </v-form>
  </div>
</template>

<script>
import ACol from '@/components/ui/ACol.vue';
export default {
  components: {
    ACol,
  },
  props: {
    value: {
      type: Object,
    },
  },
  computed: {
    validQuery() {
      try {
        JSON.parse(this.value.match);
        JSON.parse(this.value.sort);
        JSON.parse(this.value.project);
      } catch (error) {
        return false;
      }

      return true;
    },
    showRolesDebug() {
      return process.env.NODE_ENV === 'development';
    },
  },
};
</script>
