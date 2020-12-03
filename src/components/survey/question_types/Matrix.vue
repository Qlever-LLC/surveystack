<template>
  <div>
    <app-dialog
      v-model="showConfirmDeletionDialog"
      v-if="rowToBeDeleted >= 0"
      @confirm="remove(rowToBeDeleted)"
      @cancel="rowToBeDeleted = -1"
      title="Confirm Row Deletion"
      labelConfirm="DELETE"
    >
      <pre>{{rows[rowToBeDeleted]}}</pre>
    </app-dialog>

    <h2>{{control.label}}</h2>
    <v-data-table
      :headers="headers"
      :hide-default-footer="true"
      :items="rows"
      disable-sort
    >
      <template v-slot:body="{ items, headers }">
        <tbody>
          <tr
            v-for="(item,idx) in items"
            :key="idx"
          >
            <td
              v-for="(header,key) in headers"
              :key="key"
              class="py-0 px-1"
            >
              <v-form
                autocomplete="off"
                @submit.prevent=""
              >
                <v-text-field
                  v-if="header.type === 'text'"
                  :label="header.value"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  solo
                  hide-details
                  class="matrix-cell my-2"
                  autocomplete="off"
                />
                <v-text-field
                  v-else-if="header.type === 'number'"
                  :label="header.value"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = Number(v); onInput()}"
                  type="number"
                  solo
                  hide-details
                  class="matrix-cell my-2"
                />
                <v-select
                  v-else-if="header.type === 'dropdown'"
                  :items="getDropdownItems(header.value)"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  hide-details
                  solo
                  class="matrix-cell my-2"
                  :multiple="header.multiple"
                />
                <v-autocomplete
                  v-else-if="header.type === 'autocomplete'"
                  :items="getDropdownItems(header.value)"
                  :value="item[header.value]"
                  @input="v => {item[header.value] = v; onInput()}"
                  hide-details
                  solo
                  :multiple="header.multiple"
                />
                <div v-else-if="header.type === 'date'">
                  <v-menu
                    :close-on-content-click="false"
                    v-model="menus[`${idx}_${header.value}`]"
                    transition="scale-transition"
                    offset-y
                    max-width="290px"
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        :value="item[header.value]"
                        @input="v => {item[header.value] = v; onInput()}"
                        label="Date"
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                        solo
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      :value="item[header.value]"
                      @input="v => {item[header.value] = v; menus[`${idx}_${header.value}`] = false; onInput()}"
                      no-title
                    ></v-date-picker>
                  </v-menu>
                </div>

                <div v-else>
                  ???
                </div>
              </v-form>
            </td>
            <td>
              <div class="d-flex">
                <v-btn
                  icon
                  @click="rowToBeDeleted = idx"
                >
                  <v-icon>mdi-trash-can-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="duplicateRow(idx)"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-data-table>
    <div class="mt-3 mb-12">
      <v-btn
        @click="add"
        color="primary"
      >
        <v-icon left>mdi-plus</v-icon>ADD ROW
      </v-btn>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash';
import appDialog from '@/components/ui/Dialog.vue';

import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appDialog,
  },
  computed: {
    resource() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource;
    },
    headers() {
      return this.resource.content.map(col => ({
        text: col.label, value: col.value, type: col.type, multiple: col.multiple,
      }));
    },
    fields() {
      return this.resource.content.map(col => col.value);
    },
    showConfirmDeletionDialog: {
      get() {
        return this.rowToBeDeleted >= 0;
      },
      set(v) {
        // set from dialog close
        this.rowToBeDeleted = -1;
      },
    },
  },
  data() {
    return {
      rows: this.value || [],
      rowToBeDeleted: -1, //
      menus: {}, // object to hold v-models for v-menu
    };
  },
  methods: {
    add() {
      // create empty row object from headers
      const newRow = this.fields.reduce((accu, current) => ({ ...accu, [current]: null }), {});
      this.rows.push(newRow);
    },
    remove(row) {
      this.rows.splice(row, 1);
      this.rowToBeDeleted = -1;
      this.$emit('changed', this.rows);
    },
    getDropdownItems(field) {
      const column = this.resource.content.find(col => col.value === field);
      const ontology = this.resources.find(resource => resource.id === column.resource);
      return ontology.content.map(row => ({ text: row.label, value: row.value }));
    },
    onInput() {
      this.$emit('changed', this.rows);
    },
    duplicateRow(idx) {
      const clone = cloneDeep(this.rows[idx]);
      this.rows = [...this.rows, clone];
      this.$emit('changed', this.rows);
    },
    log(v) {
      console.log(v);
    },
  },
};
</script>

<style scoped>
.matrix-cell {
  min-width: 5rem;
}
</style>
