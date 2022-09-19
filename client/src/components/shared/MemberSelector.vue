<template>
  <v-dialog max-width="500" max-height="100" v-model="dialog">
    <v-card>
      <v-card-title>Search members</v-card-title>
      <v-card-text>
        <active-group-selector
          v-if="!fixedGroupId"
          :value="selectedGroupId"
          :admin-groups-only="true"
          label="Group"
          @input="setGroup"
        />
        <v-text-field v-model="q" append-icon="mdi-magnify" label="Search members" />
        <v-list>
          <v-list-item
            v-for="member in filteredMembers"
            :key="member._id"
            :disabled="member.meta.status === 'pending'"
            @click="
              $emit('selected', member);
              dialog = false;
            "
          >
            <v-list-item-content v-if="member.meta && member.meta.status === 'pending'">
              <v-list-item-title class="text--secondary"
                >[Pending] {{ member.meta.invitationEmail
                }}{{ member.meta.invitationName ? ` - ${member.meta.invitationName}` : '' }}</v-list-item-title
              >
              <v-list-item-subtitle>{{
                member.meta.dateSent ? `sent ${member.meta.dateSent}` : 'Invitation not sent yet'
              }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-content v-else>
              <v-list-item-title>{{ member.user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ member.user.email }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector';
import api from '@/services/api.service';
export default {
  components: { ActiveGroupSelector },
  props: {
    //if a fixedGroupId is passed, group chooser will be hidden
    fixedGroupId: {
      type: String,
      required: false,
    },
    show: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      selectedGroupId: this.fixedGroupId || this.$store.getters['memberships/activeGroup'],
      members: [],
      q: '',
    };
  },
  computed: {
    dialog: {
      get() {
        return this.show;
      },
      set(newValue) {
        if (!newValue) {
          this.$emit('hide');
        }
      },
    },
    filteredMembers() {
      if (!this.q) {
        return this.members;
      }
      const ql = this.q.toLowerCase();

      return this.members.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(ql) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(ql)) {
            return true;
          }
        } else if (entity.meta.invitationEmail) {
          if (entity.meta.invitationEmail.toLowerCase().indexOf(ql) > -1) {
            return true;
          }
        }

        return false;
      });
    },
  },
  methods: {
    async fetchMembers(groupId) {
      const { data: members } = await api.get(`/memberships?group=${groupId}&populate=true`);
      this.members = members;
    },
    setGroup(groupId) {
      this.selectedGroupId = groupId;
      this.fetchMembers(this.selectedGroupId);
    },
  },
  mounted() {
    this.value = true;
    this.fetchMembers(this.selectedGroupId);
  },
  async created() {
    this.value = true;
  },
};
</script>
