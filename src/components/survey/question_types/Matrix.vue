<template>
  <div>
    <v-data-table
      :headers="headers"
      :hide-default-footer="true"
      :items="rows"
    >
      <template v-slot:body="{ items, headers }">
        <tbody>
          <tr
            v-for="(item,idx,k) in items"
            :key="idx"
          >
            <td
              v-for="(header,key) in headers"
              :key="key"
            >
              <v-text-field
                :label="header.value"
                :value="item[header.value]"
                @input="v => item[header.value] = v"
                solo
              />
            </td>
          </tr>
        </tbody>
      </template>
    </v-data-table>
    <div>{{rows}}</div>
    <div>
      <v-btn @click="add">ADD ROW</v-btn>
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
      return resource.content.fields.map(f => ({ text: f, value: f }));
    },
  },
  data() {
    return { rows: [] };
  },
  methods: {
    add() {
      this.rows.push({
        field: 'f', operation: 'o', date: 'd', depth: 'd', tilled: 't',
      });
    },
  },
};
</script>
