<template>
  <div>
    <a-form class="d-flex flex-column">
      <a-textarea v-model="value.match" outlined label="Match" rows="3" />
      <a-row>
        <v-col>
          <a-text-field v-model="value.sort" label="Sort" dense />
        </v-col>
        <v-col>
          <a-text-field v-model="value.project" label="Projection" dense />
        </v-col>
        <v-col cols="2">
          <a-text-field v-model.number="value.skip" label="Skip" dense />
        </v-col>
        <v-col cols="2">
          <a-text-field v-model.number="value.limit" label="Limit" dense />
        </v-col>
      </a-row>

      <a-row dense>
        <v-col>
          <a-checkbox label="Show irrelevant fields" v-model="value.showIrrelevant" class="my-0" hide-details />
        </v-col>
      </a-row>

      <a-row dense>
        <v-col>
          <a-checkbox label="Show data meta (CSV)" v-model="value.showCsvDataMeta" class="my-0" hide-details />
        </v-col>
      </a-row>

      <a-row v-if="showRolesDebug">
        <v-col cols="6">
          <a-text-field v-model.number="value.roles" label="Roles (Debug)" dense />
        </v-col>
      </a-row>

      <div class="d-flex justify-end">
        <a-btn class="ma-2" @click="$emit('show-advanced', false)" text>Basic</a-btn>
        <a-btn class="ma-2" outlined @click="$emit('reset')">Reset</a-btn>
        <a-btn class="ma-2" color="primary" @click="$emit('apply-advanced-filters')" :disabled="!validQuery"
          >Apply</a-btn
        >
      </div>
    </a-form>
  </div>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
