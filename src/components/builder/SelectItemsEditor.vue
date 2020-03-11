<template>
  <div class="select-items-editor mb-3">
    <!-- <h4>Items</h4> -->
    <v-card-title class="px-0 d-flex justify-space-between">
      <span>
        Items
      </span>
    </v-card-title>
    <v-list>
      <template
        v-for="(item) in items"
      >
        <v-list-item :key="item.value">
          <v-list-item-content>
            <v-row>
              <v-col class="py-0">
                <v-text-field
                  label="Label"
                  :value="item.label"
                  outlined

                />
              </v-col>
              <v-col class="py-0">
                <v-text-field
                  label="Value"
                  :value="item.value"
                  outlined

                />
              </v-col>

            </v-row>
          </v-list-item-content>
          <v-list-item-action class="mt-n3">
            <v-btn icon>
              <v-icon color="grey">mdi-trash-can-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <v-btn class="ml-auto mr-0 d-block mb-3">Add Item</v-btn>

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
