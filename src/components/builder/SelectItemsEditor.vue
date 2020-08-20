<template>
  <div class="select-items-editor mb-3">
    <!-- <h4>Items</h4> -->
    <v-card-title class="px-0 d-flex justify-space-between">
      <span>
        Selection List
      </span>

    </v-card-title>
    <v-list>
      <draggable :list="value">
        <v-card
          v-for="(item, index) in value"
          :key="index"
          class="mb-2 draggable-cursor"
          outlined
        >
          <v-list-item class="draggable-cursor px-1">
            <v-list-item-content class="pb-1">
              <v-row>
                <v-col class="py-0 pl-4 pr-1">
                  <v-text-field
                    label="Label"
                    :value="item.label"
                    @input="(value) => handleItemInput(index, 'label', value)"
                    :rules="[rules.notEmpty]"
                    outlined
                    dense
                  />
                </v-col>
                <v-col class="py-0 pl-1 pr-3">
                  <v-text-field
                    label="Value"
                    :value="item.value"
                    @input="(value) => handleItemInput(index, 'value', value)"
                    :rules="[rules.notEmpty]"
                    outlined
                    dense
                  />
                </v-col>

              </v-row>
            </v-list-item-content>
            <v-list-item-action class="mt-n3">
              <v-btn icon>
                <v-icon
                  color="grey"
                  @click="() => deleteItem(index)"
                >mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-card>
      </draggable>
    </v-list>
    <v-row>

      <v-btn
        class="ml-auto mr-0 d-block mb-3"
        @click="addItem"
      >
        +&nbsp;Add Item
      </v-btn>
    </v-row>


  </div>

</template>

<script>
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,
  },
  data() {
    return {
      rules: {
        notEmpty: val => ((val !== null && val !== '') ? true : 'Please enter a string'),
      },
    };
  },
  methods: {
    setItems(items) {
      console.log('set items', items);
      this.$emit('set-control-source', items);
    },
    createItem({ value = '', label = '' } = {}) {
      return {
        value: '',
        label: '',
      };
    },
    addItem() {
      this.$emit('set-control-source', [
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
      const newItem = {
        ...this.value[index],
        [type]: value,
      };
      const newItems = [
        ...this.value.slice(0, index),
        newItem,
        ...this.value.slice(index + 1, this.value.length),
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
      required: true,
    },
  },
};
</script>

<style scoped>
.draggable-cursor {
  /* cursor: grab; */
  cursor: all-scroll;
}

.draggable-cursor:active {
  /* cursor: grabbing; */
  cursor: all-scroll;
}
</style>
