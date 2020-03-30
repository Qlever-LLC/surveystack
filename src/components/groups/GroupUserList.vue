<template>
  <div>
    <v-card>
      <v-card-title>
        Members
        <v-spacer />
        <v-btn
          color="primary"
          class="ml-4"
          :to="{name: 'users-new'}"
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
            v-for="(user,i) in users"
            :key="`user-${i}`"
            two-line
          >
            <v-list-item-content>
              <v-list-item-title>{{user.name}}</v-list-item-title>
              <v-list-item-subtitle>{{user.email}}</v-list-item-subtitle>
              <v-autocomplete
                class="mt-4"
                dense
                @change="onChange"
                :items="items"
                outlined
                :delimiters="[',']"
                chips
                label="FarmOS: RFC Aggregator"
                multiple
              >
              </v-autocomplete>

              <v-autocomplete
                class="mt-4"
                dense
                @change="onChange"
                :items="items"
                outlined
                :delimiters="[',']"
                chips
                label="FarmOS: GM Aggregator"
                multiple
              >
              </v-autocomplete>
            </v-list-item-content>
            <v-list-item-action>
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
  },
  computed: {
    users() {
      if (!this.q) {
        return this.entities;
      }
      return this.entities.filter((entity) => {
        if (entity.name.toLowerCase().indexOf(this.q.toLowerCase()) > -1) {
          return true;
        }

        if (entity.email.toLowerCase().startsWith(this.q.toLowerCase())) {
          return true;
        }
        return false;
      });
    },
  },
};
</script>
