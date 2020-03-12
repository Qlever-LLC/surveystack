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
        v-for="(item, index) in value"
      >
        <v-list-item :key="index">
          <v-list-item-content>
            <v-row>
              <v-col class="py-0">
                <v-text-field
                  label="Label"
                  :value="item.label"
                  @input="(value) => handleItemInput(index, 'label', value)"
                  outlined
                />
              </v-col>
              <v-col class="py-0">
                <v-text-field
                  label="Value"
                  :value="item.value"
                  @input="(value) => handleItemInput(index, 'value', value)"
                  outlined
                />
              </v-col>

            </v-row>
          </v-list-item-content>
          <v-list-item-action class="mt-n3">
            <v-btn icon>
              <v-icon color="grey" @click="() => deleteItem(index)">mdi-trash-can-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <v-btn class="ml-auto mr-0 d-block mb-3" @click="addItem">
      +&nbsp;Add Item
    </v-btn>

  </div>
</template>

<script>
// import draggable from 'vuedraggable';

export default {
  components: {
    // draggable,
  },
  methods: {
    setItems() {
      this.$emit('set-control-source', this.items);
    },
    createItem({ value = '', label = '' } = {}) {
      return {
        value: '',
        label: '',
      };
    },
    addItem() {
      // console.log('add item', this.$emit, this.items);
      this.$emit('set-control-source', [
      // this.$emit('input', [
        ...this.value,
        this.createItem(),
      ]);
    },
    deleteItem(index) {
      const newItems = this.value.filter((item, i) => index !== i);
      console.log('delete item', index, newItems);
      this.$emit('set-control-source', newItems);
    },
    handleItemInput(index, type, value) {
      console.log('handle input item', value, index, type);
      const newItem = {
        ...this.value[index],
        [type]: value,
      };
      const newItems = [
        ...this.value.slice(0, index),
        newItem,
        ...this.value.slice(index + 1, -1),
      ];
      this.$emit('set-control-source', newItems);
    },
  },
  model: {
    // prop: 'items',
    event: 'set-control-source',
    // event: 'change',
  },
  props: {
    value: {
      type: Array,
    },
    // items: {
    //   type: Array,
    //   required: true,
    //   default: () => ([
    //     // {
    //     //   label: 'Item 1',
    //     //   value: 'item-1',
    //     // },
    //     // {
    //     //   label: '',
    //     //   value: '',
    //     // },
    //   ]),
    // },
  },
};
</script>

<style>

</style>
