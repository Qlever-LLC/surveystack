<template>
  <div>
    <v-card>
      <v-card-title>
        Members
        <v-spacer />
        <v-btn
          color="primary"
          class="ml-4"
          :to="{name: 'memberships-new', query: {group: group._id, role: 'user' }}"
          text
        >New...</v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field
          label="Search"
          append-icon="mdi-magnify"
          v-model="q"
        />
        <template v-if="entities.length > 0">
          <v-list-item
            v-for="(member) in members"
            :key="`membership-${member._id}`"
            :to="`/memberships/${member._id}/edit`"
            two-line
          >
            <v-list-item-content v-if="member.meta.status === 'pending'">
              <v-list-item-title class="text--secondary">[Pending] Invitation</v-list-item-title>
              <v-list-item-subtitle>{{member.meta.sentTo}}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-content v-else>
              <v-list-item-title>{{member.user.name}}</v-list-item-title>
              <v-list-item-subtitle>{{member.user.email}}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-icon v-if="member.role === 'admin'">mdi-crown-outline</v-icon>
            </v-list-item-action>
          </v-list-item>
        </template>
        <div
          v-else
          class="
                grey--text"
        >No members yet
        </div>

      </v-card-text>

    </v-card>

  </div>
</template>

<script>
export default {
  data() {
    return {
      q: '',
      items: [
        'Dan\'s Farm',
        'Gregs\'s Farm',
        'Mike\'s Farm',
      ],
    };
  },
  props: {
    entities: {
      type: Array,
    },
    group: {
      type: Object,
    },
  },
  computed: {
    members() {
      if (!this.q) {
        return this.entities;
      }
      const q = this.q.toLowerCase();

      return this.entities.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(q) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(q)) {
            return true;
          }
        } else if (entity.meta.sentTo) {
          if (entity.meta.sentTo.toLowerCase().indexOf(q) > -1) {
            return true;
          }
        }

        return false;
      });
    },
  },
};
</script>
