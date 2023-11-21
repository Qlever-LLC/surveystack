<template>
  <div class="local-container pa-4">
    <div class="user-row">
      <div class="user-icon"><span v-if="user.admin" class="mdi mdi-crown pr-1 mr-2"></span></div>
      <div class="user-name">{{ user.name }}</div>
      <div class="user-email ml-2 font-weight-light text--lighten-2">{{ user.email }}</div>
    </div>
    <div class="instance-map mt-1 pb-1" v-for="instance in instanceMap" :key="`instance-${instance.name}`">
      <div class="instance-name ml-4">
        <v-btn @click="$emit('open', { instanceName: instance.name, userId: user.id })" small icon>
          <v-icon small>mdi-open-in-new</v-icon>
        </v-btn>
        {{ instance.name }}
      </div>
      <div class="instance-groups">
        <div
          class="instance-group"
          v-for="(group, idx) in instance.groups"
          :key="`user-${user.id}-instance-${instance.name}-group-${group.name}`"
        >
          <div class="group-chip mx-1" v-if="idx < 3 || more.includes(`${user.id}-${instance.name}`)">
            <a-tooltip top>
              <template v-slot:activator="{ on }">
                <a-chip small v-on="on"> {{ group.name }}</a-chip>
              </template>
              <span>{{ group.path }}</span>
            </a-tooltip>
          </div>
        </div>
        <div v-if="instance.groups.length >= 4 && !more.includes(`${user.id}-${instance.name}`)">
          <v-btn text x-small @click="showMore(user, instance)">+ {{ `${instance.groups.length - 3}` }} more</v-btn>
        </div>
        <v-btn
          text
          small
          dense
          @click="$emit('disconnect', { groupId: null, userId: user.id, instanceName: instance.name })"
        >
          manage
        </v-btn>
      </div>
    </div>

    <div class="create-button mt-2">
      <v-btn text color="green" x-small @click="$emit('connect', user.id)">+ connect farm</v-btn>
    </div>
  </div>
</template>

<script>
import ATooltip from '@/components/ui/ATooltip.vue';
export default {
  components: {
    ATooltip,
  },
  data() {
    return {
      more: [],
    };
  },
  props: ['user', 'instance-map'],
  emits: ['disconnect', 'connect', 'open'],
  methods: {
    showMore(user, instance) {
      this.more.push(`${user.id}-${instance.name}`);
    },
  },
};
</script>

<style scoped>
.local-container {
  display: flex;
  background-color: rgb(243, 242, 242);
  flex-direction: column;
}

.user-row {
  display: flex;
  flex-direction: row;
}

.instance-map {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #ddd;
}

.instance-name {
  flex-shrink: 0;
}

.instance-groups {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  justify-content: right;
  flex-wrap: wrap;
  flex-shrink: 1;
  row-gap: 0.2rem;
}
</style>
