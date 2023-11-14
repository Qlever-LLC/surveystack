<template>
  <v-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Plans</h1>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="my-8 align-center mt-6"
      ></v-progress-circular>
    </div>

    <v-row class="align-baseline">
      <a-col>
        <v-text-field outlined primary label="New Plan Name" v-model.trim="planName"></v-text-field>
      </a-col>
      <a-col>
        <v-text-field outlined primary label="New Plan URL" hint="farmos.net" v-model.trim="planUrl"></v-text-field>
      </a-col>
      <a-col>
        <v-btn color="primary" @click="$emit('create-plan', planName, planUrl)">Create Plan</v-btn>
      </a-col>
    </v-row>

    <v-divider class="my-4"></v-divider>

    <v-simple-table v-if="!loading">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Plan Name</th>
            <th class="text-left">Plan Base URL</th>
            <th class="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(plan, idx) in viewModel.plans" :key="`plan--${idx}`">
            <td>{{ plan.planName }}</td>
            <td>{{ plan.planUrl }}</td>
            <td>
              <v-btn color="red" @click="$emit('delete-plan', plan._id)" dark>Delete</v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-container>
</template>

<script>
import ACol from '@/components/ui/ACol.vue';

export default {
  components: {
    ACol,
  },
  props: ['viewModel', 'loading'],
  data() {
    return {
      planName: '',
      planUrl: '',
    };
  },
};
</script>
