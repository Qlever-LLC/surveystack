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
              <v-text-field
                v-if="header.type === 'text'"
                :label="header.value"
                :value="item[header.value]"
                @input="v => {item[header.value] = v; onInput()}"
                solo
                hide-details
                class="matrix-cell my-2"
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
              />
              <v-autocomplete
                v-else-if="header.type === 'autocomplete'"
                :items="getDropdownItems(header.value)"
                :value="item[header.value]"
                @input="v => {item[header.value] = v; onInput()}"
                hide-details
                solo
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
    headers() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource.content.headers.filter(h => !h.value.startsWith('_'));
    },
    fields() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource.content.fields.filter(f => !f.startsWith('_'));
    },
    items() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource.content.data;
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
      rows: this.value,
      rowToBeDeleted: -1, //
      menus: {}, // object to hold v-models for v-menu
    };
  },
  methods: {
    add() {
      // create empty row object from headers
      console.log(this.fields);
      const newRow = this.fields.reduce((accu, current) => ({ ...accu, [current]: null }), {});
      this.rows.push(newRow);
    },
    remove(row) {
      this.rows.splice(row, 1);
      this.rowToBeDeleted = -1;
      this.$emit('changed', this.rows);
    },
    getDropdownItems(field) {
      return this.items.map(row => row[field]);
    },
    onInput() {
      this.$emit('changed', this.rows);
    },
    duplicateRow(idx) {
      const clone = cloneDeep(this.rows[idx]);
      this.rows = [...this.rows, clone];
      this.$emit('changed', this.rows);
    },
    prefill() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      // need to clone, otherwise SurveyBuilder's resource is changed when removing _row/_prefill
      const prefilled = cloneDeep(resource.content.data.filter(row => row._prefill));
      prefilled.forEach((item) => {
        this.headers.filter(h => h.type === 'number').forEach((h) => {
          item[h.value] = Number(item[h.value]) || null;
        });
        delete item._row;
        delete item._prefill;
      });

      this.rows = prefilled;
      this.$emit('changed', this.rows);
    },
    log(v) {
      console.log(v);
    },
  },
  created() {
    if (!this.rows || this.rows.length === 0) {
      this.prefill();
    }
  },
};
</script>

<style scoped>
.matrix-cell {
  min-width: 5rem;
}
</style>
