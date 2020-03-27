<template>
  <v-container>
    <v-card>
      <v-card-title>{{entity.email}}</v-card-title>
      <v-card-subtitle>{{entity._id}}</v-card-subtitle>
      <v-card-text>{{entity.name}}</v-card-text>
    </v-card>

    <v-card class="pa-4 mt-4">
      <v-card-text>This is only seen by the admin of the respective group.<br>As Admin of RFC I would only see the RFC dropdown. <br> As user I am seeing the farms as list, but can't edit.</v-card-text>
      <v-card-title>FarmOS Farms</v-card-title>
      <div class="ma-4 pa-4 round-border">
        <h4>Real Food Campaign</h4>

        <v-autocomplete
          class="mt-4"
          dense
          @change="onChange"
          :items="items"
          outlined
          :delimiters="[',']"
          chips
          label="Farms"
          multiple
        >
        </v-autocomplete>
      </div>
      <div class="ma-4 pa-4 round-border">
        <h4>General Mills</h4>
        <v-autocomplete
          class="mt-4"
          dense
          @change="onChange"
          :items="items"
          outlined
          :delimiters="[',']"
          chips
          label="Farms"
          multiple
        >
        </v-autocomplete>
      </div>
      <div class="ma-4 pa-4 round-border">
        <h4>NOFA</h4>
        <v-autocomplete
          class="mt-4"
          dense
          @change="onChange"
          :items="items"
          outlined
          :delimiters="[',']"
          chips
          label="Farms"
          multiple
        >
        </v-autocomplete>
      </div>

      <div class="d-flex justify-end pa-4">
        <v-btn
          text
          @click="cancel"
        >Cancel</v-btn>
        <v-btn
          color="primary"
          type="submit"
        >Save</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      entity: {
        _id: '',
        email: '',
        name: '',
      },
      items: [
        "Greg's Farm",
        "Dan's Farm",
        "Jon's Farm",
      ],
    };
  },
  async created() {
    const { id } = this.$route.params;
    const { data } = await api.get(`/users/${id}`);
    this.entity = { ...this.entity, ...data };
  },
};
</script>

<style scoped>
.round-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}
</style>
