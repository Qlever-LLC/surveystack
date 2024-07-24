<template>
  <a-dialog max-width="500" max-height="50vh" v-model="dialog">
    <a-card>
      <a-card-title>Search members</a-card-title>
      <a-card-text>
        <group-selector
          v-if="!fixedGroupId"
          :modelValue="selectedGroupId"
          :admin-groups-only="true"
          label="Group"
          @update:modelValue="setGroup" />
        <a-text-field v-model="q" append-inner-icon="mdi-magnify" label="Search members" />
        <a-list>
          <a-list-item
            v-for="member in filteredMembers"
            :key="member._id"
            :disabled="member.meta.status === 'pending'"
            @click="
              $emit('selected', member);
              dialog = false;
            ">
            <div v-if="member.meta && member.meta.status === 'pending'">
              <a-list-item-title class="text-secondary"
                >[Pending] {{ member.meta.invitationEmail
                }}{{ member.meta.invitationName ? ` - ${member.meta.invitationName}` : '' }}</a-list-item-title
              >
              <a-list-item-subtitle>{{
                member.meta.dateSent ? `sent ${member.meta.dateSent}` : 'Invitation not sent yet'
              }}</a-list-item-subtitle>
            </div>
            <div v-else>
              <a-list-item-title>{{ member.user.name }}</a-list-item-title>
              <a-list-item-subtitle>{{ member.user.email }}</a-list-item-subtitle>
            </div>
          </a-list-item>
        </a-list>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import GroupSelector from '@/components/shared/GroupSelector.vue';
import api from '@/services/api.service';

export default {
  components: {
    GroupSelector,
  },
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
      selectedGroupId: this.fixedGroupId,
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
  watch: {
    fixedGroupId: function (newVal) {
      this.selectedGroupId = newVal;
      this.fetchMembers(this.selectedGroupId);
    },
  },
};
</script>
