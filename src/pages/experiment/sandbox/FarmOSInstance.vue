<template>
  <v-flex>
    <v-form
      class="mt-3"
      @keydown.enter.prevent="submit"
    >
      <v-text-field
        v-model="instance.name"
        label="Name"
        placeholder="Name"
        outlined
      />

      <v-text-field
        v-model="instance.url"
        label="URL"
        placeholder="instance URL"
        outlined
      />

      <v-autocomplete
        label="Members with Access to Farm"
        v-model="activeUsers"
        :items="members"
        item-value="_id"
        item-text="text"
        outlined
        deletable-chips
        chips
        multiple
        return-object
      >

        <template v-slot:item="{item}">
          <div v-if="item.user">{{ item.user.name }} </div>
          <div v-else>
            <v-icon left>mdi-account-clock</v-icon> {{ item.meta.invitationEmail }}
          </div>
        </template>
      </v-autocomplete>

      <v-btn
        class="mx-2"
        color="primary"
        @click="save"
      >Save Changes</v-btn>
    </v-form>

  </v-flex>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

export default {
  props: [
    'instance',
  ],
  data() {
    return {
      activeUsers: [],
      members: [],
    };
  },
  methods: {
    save() {
      this.$emit('save', this.instance);
    },
    testConnection() {
      this.$emit('testConnection', this.instance);
    },
  },
  async mounted() {
    try {
      const { groupId: id } = this.instance;
      const { data } = await api.get(`/groups/${id}?populate=true`);
      this.entity = { ...this.entity, ...data };

      const { data: members } = (await api.get(`/memberships?group=${this.entity._id}&populate=true`));
      members.forEach((m) => {
        // eslint-disable-next-line no-param-reassign
        m.text = m.user ? m.user.name : m.meta.invitationEmail;
      });

      this.members = members;

      const { data: integrations } = await api.get(`/group-integrations?group=${id}`);
      this.integrations = integrations;
      console.log('members', members);
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>

<style>
/* Control color. */
.ol-control {
  background-color: rgba(255, 255, 255, 0.25);
}
.ol-control svg {
  fill: green;
}
.ol-control button {
  color: green;
  background-color: rgba(255, 255, 255, 0.8);
}
.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
.ol-scale-line {
  background: rgba(255, 255, 255, 0.25);
}

/* Control backgrounds. */
.ol-geocoder .gcd-gl-btn {
  background-image: none;
}
.ol-geocoder .gcd-gl-btn:after {
  content: "\1f50d";
}
.layer-switcher > button {
  background-size: 1.5em 1.5em;
}

/* Control sizing. */
.ol-control button,
.ol-geocoder .gcd-gl-btn {
  height: 1.75em;
  width: 1.75em;
}
.ol-geocoder .gcd-gl-control {
  width: 2.4em;
  height: 2.4em;
}
.ol-geocoder .gcd-gl-expanded {
  width: 16em;
  height: 2.4em;
}

/* Control positioning. */
.ol-geolocate.ol-control {
  left: 3.5em;
}
.ol-geocoder.gcd-gl-container {
  top: 0.5em;
  left: 6.5em;
}
.ol-geocoder .gcd-gl-input {
  left: 3em;
}
.ol-edit.ol-control {
  top: 5.5em;
}
.ol-rotate.ol-control {
  right: 3.5em;
}
.layer-switcher {
  top: 3.5em;
}
</style>
