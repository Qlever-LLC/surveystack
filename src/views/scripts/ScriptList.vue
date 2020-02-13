<template>
  <v-container>
    <app-entity-list
      :entities="entities"
      collection="scripts"
    />
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appEntityList from '@/components/ui/EntityList.vue';

export default {
  components: {
    appEntityList,
  },
  data() {
    return {
      entities: [],
    };
  },
  async created() {
    const { data } = await api.get('/scripts');
    this.entities = data;
  },
};
</script>
