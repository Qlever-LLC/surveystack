<template>
  <div>
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
                class="my-2"
                style="min-width: 5rem"
              />
              <v-text-field
                v-if="header.type === 'number'"
                :label="header.value"
                :value="item[header.value]"
                @input="v => {item[header.value] = Number(v); onInput()}"
                type="number"
                solo
                hide-details
                class="my-2"
                style="min-width: 5rem"
              />
              <v-select
                v-if="header.type === 'dropdown'"
                :items="['gold', 'silver', 'bronze']"
                @input="v => {item[header.value] = v; onInput()}"
                hide-details
                solo
                class="my-2"
                style="min-width: 5rem"
              />
              {{header.type}}
            </td>
            <td>
              <v-btn
                icon
                @click="remove(idx)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
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
    <div>
      {{rows}}
    </div>
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  computed: {
    headers() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource.content.headers;
    },
    fields() {
      const resource = this.resources.find(r => r.id === this.control.options.source);
      return resource.content.fields;
    },
  },
  data() {
    return { rows: this.value || [] };
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
      this.$emit('changed', this.rows);
    },
    onInput() {
      this.$emit('changed', this.rows);
    },
  },
};
</script>
