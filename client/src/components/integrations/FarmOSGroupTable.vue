<template>
  <div class="member-rows">
    <FarmOSMemberRow
      class="mb-1"
      v-for="member in remappedMembers"
      :key="`user-${member.id}`"
      :user="member"
      :instance-map="member.farms"
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
            name: f.instanceName,
            groups: f.groups.map((g) => ({
              name: g.name,
              id: g.groupId,
              path: g.path,
            })),
          }));

        return {
          id: m.user,
          admin: m.admin,
          email: m.email,
          name: m.name,
          farms,
        };
      });
    },
  },
};
</script>
