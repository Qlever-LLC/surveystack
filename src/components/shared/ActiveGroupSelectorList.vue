<template>
  <!-- <div class="survey-group-selector-list"> -->
  <!-- <v-select
      :value="value"
      @input="handleInput"
      :items="groupItems"
      item-text="text"
      item-value="value"
      :label="label"
      :outlined="outlined"
      hide-details
    >
    </v-select> -->
  <v-list-group
    prepend-icon="mdi-account-check"
    :value="true"
  >
    <template v-slot:activator>
      <v-list-item-title v-if="activeGroup">{{activeGroupName}}</v-list-item-title>
      <v-list-item-title v-else>No Group selected</v-list-item-title>
    </template>
    <v-list-item
      flat
      class="pt-0"
    >
      <!-- <v-subheader class="text-uppercase px-0">Groups</v-subheader> -->
      <!-- v-model="activeItem" -->
      <v-list-item-group
        :value="activeItem"
        color="primary"
        mandatory
      >

        <v-list-item
          v-for="item in groupItems"
          :key="item.text"
          @click="() => handleInput(item.value)"
        >
          <v-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            {{ item.text }}
          </v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list-item>
    <!-- </div> -->
  </v-list-group>
</template>

<script>
export default {
  data() {
    return {
      // activeItem: this.groupItems.findIndex(item => item.value === this.activeGroup || item.value.id === this.activeGroup),
    };
  },
  computed: {
    groups() {
      return this.$store.getters['memberships/groups'];
    },
    activeItem: {
      get() {
        return this.groupItems.findIndex(item => item.value === this.activeGroup || item.value.id === this.activeGroup);
      },
    },
    groupItems() {
      return this.groups.map(({ name, _id, path }) => {
        if (this.returnObject) {
          return {
            text: name,
            value: {
              id: _id,
              path,
            },
          };
        }

        return {
          text: name,
          value: _id,
        };
      });
    },
    // memberships() {
    //   return this.$store.getters['memberships/memberships'];
    // },
    activeGroup() {
      return this.$store.getters['memberships/activeGroup'];
    },
    activeGroupName() {
      if (!this.activeGroup) {
        return '';
      }

      // it's possible that a membership that a membership was deleted on the server
      // so check if it still exists first
      const group = this.groups.find(g => g._id === this.activeGroup);
      if (group) {
        return group.name;
      }
      return '';
    },
  },
  props: {
    value: {
    },
    // surveyGroup: {
    //   type: String,
    // },
    returnObject: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: 'Active Group',
    },
    outlined: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleInput(val) {
      this.$emit('input', val);
    },
    isActiveGroup(value) {
      return value === this.activeGroup || value.id === this.activeGroup;
    },
  },
  created() {
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },
};
</script>

<style>
</style>
