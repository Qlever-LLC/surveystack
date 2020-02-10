<template>
  <v-container>
    <h1>Group Edit</h1>

    <form @submit.prevent="onSubmit">
      <v-text-field
        label="Name"
        placeholder="Enter group name"
        class="form-control"
        id="group-name"
        v-model="entity.name"
      />
      <p>path={{entity.path | showNull}}</p>
      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          type="submit"
        >Submit</v-btn>
      </div>
    </form>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

export default {
  data() {
    return {
      entity: {
        _id: '',
        name: '',
        path: null,
      },
    };
  },
  methods: {
    async onSubmit() {
      if (this.entity.name.trim() === '') {
        console.log('name must not be empty');
        return;
      }

      const data = this.entity;
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/groups/${this.entity._id}` : '/groups';

      try {
        await api.customRequest({
          method,
          url,
          data,
        });
        this.$router.push(
          `/groups/${this.entity.path ? this.entity.path : ''}${
            this.entity.name
          }`,
        );
      } catch (err) {
        console.log(err);
      }
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'groups-new',
    );

    if (this.$route.query.path) {
      this.entity.path = this.$route.query.path;
    }

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/groups/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>
