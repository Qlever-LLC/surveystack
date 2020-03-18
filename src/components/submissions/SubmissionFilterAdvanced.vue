<template>
  <v-card>
    <v-card-title>Advanced Filters</v-card-title>
    <v-card-text>
      <v-form class="d-flex flex-column">
        <v-textarea
          v-model="value.match"
          outlined
          label="Match"
          rows="3"
        />
        <v-row>
          <v-col>
            <v-text-field
              v-model="value.sort"
              label="Sort"
              dense
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model="value.project"
              label="Projection"
              dense
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="value.skip"
              label="Skip"
              dense
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="value.limit"
              label="Limit"
              dense
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="value.roles"
              label="Roles (Debug)"
              dense
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-end my-2">
          <v-btn
            @click="$emit('showAdvanced', false)"
            text
          >Basic...</v-btn>
          <v-btn
            @click="add"
            color="primary"
          >Apply</v-btn>
        </div>

      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    value: {
      type: Object,
    },
  },
};
</script>
