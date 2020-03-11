<template>
  <div class="select-items-editor">
    <!-- <v-list-item-group> -->
    <v-list>
      <v-list-item
        :v-for="item in items"
      >
        <template>
          <v-list-item-content>
            <v-input
              label="Label"
              :value="item.label"
              outlined
            />
            <v-input
              label="value"
              :value="item.value"
              outlined
            />
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon>
              <v-icon color="grey lighten-1">mdi-trash</v-icon>
            </v-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
    <!-- </v-list-item-group> -->

    <v-btn>Add</v-btn>
  </div>
</template>

<script>
// import draggable from 'vuedraggable';

export default {
  components: {
    // draggable,
  },
  props: {
    items: {
      type: Array,
      // required: true,
      default: () => ([
        {
          label: 'Item 1',
          value: 'item-1',
        },
        {
          label: 'Item 2',
          value: 'item-2',
        },
      ]),
    },
  },
};
</script>

<style>

</style>
