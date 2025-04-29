<template>
  <div class="member-rows">
    <FarmOSMemberRow
      class="mb-1"
      v-for="member in remappedMembers"
      :key="`user-${member.id}`"
      :user="member"
      :instance-map="member.farms"
      @success="() => $emit('success')"
      @open="(item) => $emit('open', item)"
      @connect="(item) => $emit('connect', item)"
      @disconnect="(item) => $emit('disconnect', item)" />
  </div>
</template>

<script>
import FarmOSMemberRow from './FarmOSMemberRow.vue';

export default {
  components: {
    FarmOSMemberRow,
  },
  props: ['members'],
  emits: ['disconnect', 'connect', 'open'],
  computed: {
    remappedMembers() {
      return this.members.map((m) => {
        const farms = m.connectedFarms
          .filter((f) => f.groups && f.groups.length > 0)
          .map((f) => ({
            name: f.organizationName ? `${f.organizationName} (${f.instanceName})` : f.instanceName,
            organizationId: f.organizationId,
            organizationName: f.organizationName,
            instanceName: f.instanceName,
            groups: f.groups.map((g) => ({
              name: g.name,
              id: g.groupId,
              path: g.path,
            })),
            id: f._id,
          }));

        return {
          id: m.user,
          admin: m.admin,
          email: m.email,
          name: m.name,
          instanceName: m.instanceName,
          organizationName: m.organizationName,
          farms,
        };
      });
    },
  },
};
</script>
