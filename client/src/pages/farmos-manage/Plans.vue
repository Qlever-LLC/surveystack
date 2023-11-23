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

    <a-row class="align-baseline">
      <v-col>
        <a-text-field outlined primary label="New Plan Name" v-model.trim="planName" />
      </v-col>
      <v-col>
        <a-text-field outlined primary label="New Plan URL" hint="farmos.net" v-model.trim="planUrl" />
      </v-col>
      <v-col>
        <a-btn color="primary" @click="$emit('create-plan', planName, planUrl)">Create Plan</a-btn>
      </v-col>
    </a-row>

    <a-divider class="my-4" />

    <a-table v-if="!loading">
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
              <a-btn color="red" @click="$emit('delete-plan', plan._id)" dark>Delete</a-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </a-table>
  </v-container>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  props: ['viewModel', 'loading'],

  data() {
    return {
      planName: '',
      planUrl: '',
    };
  },
};
</script>
