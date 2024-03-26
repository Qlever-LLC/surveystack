<template>
  <a-container>
    <basic-list
      listCard
      :entities="entities"
      :buttonNew="{ title: 'Create new Script', link: { name: 'group-scripts-new', params: { id: $route.params.id } } }"
      :menu="[
        {
          title: 'View Script',
          icon: 'mdi-open-in-new',
          action: (e) => `/groups/${$route.params.id}/scripts/${e._id}`,
          color: 'green',
        },
        {
          title: 'Edit Script',
          icon: 'mdi-pencil',
          action: (e) => `/groups/${$route.params.id}/scripts/${e._id}/edit`,
        },
      ]">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-xml </a-icon>
        Scripts
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ entities.length }} </a-chip>
      </template>
      <template v-slot:noValue> No Scripts available </template>
    </basic-list>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import appEntityList from '@/components/ui/EntityList.vue';
import BasicList from '@/components/ui/BasicList2.vue';

export default {
  components: {
    BasicList,
  },
  data() {
    return {
      entities: [],
    };
  },
  methods: {
    async fetchData() {
      const q = '';
      const { data } = await api.get(`/scripts?q=${q}&groupId=${this.$route.params.id}`);
      this.entities = data;
    },
  },
  created() {
    this.fetchData();
  },
};
</script>
