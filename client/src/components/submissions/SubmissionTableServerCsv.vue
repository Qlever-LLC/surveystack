<template>
  <a-container fluid>
    <h1>Andreas' Sandbox</h1>
    <a-card class="pt-2">
      <v-data-table
        :headers="headers"
        :items="items"
        show-select
        item-key="_id"
        :search="search"
        :mobile-breakpoint="0"
      >
        <template v-slot:top>
          <a-toolbar flat>
            <a-row>
              <a-col>
                <a-toolbar-title>Simple CSV</a-toolbar-title>
              </a-col>
              <a-col>
                <a-text-field
                  v-model="search"
                  append-inner-icon="mdi-search"
                  label="Search"
                  single-line
                  autocomplete="off"
                />
              </a-col>
              <a-col :cols="2">
                <a-switch v-model="excludeMeta" label="Hide meta" class="mt-2" />
              </a-col>
            </a-row>
          </a-toolbar>
        </template>
        <template v-slot:header="{ props: { headers } }">
          <thead>
            <tr>
              <th v-for="(header, i) in headers" :key="header.text">
                <a-text-field v-if="i > 0" @update:modelValue="(v) => hello(v, header.text)" />
              </th>
            </tr>
          </thead>
        </template>
      </v-data-table>
    </a-card>
  </a-container>
</template>

<script>
import papa from 'papaparse';
import api from '@/services/api.service';

export default {
  data() {
    return {
      excludeMeta: true,
      csv: null,
      parsed: null,
      search: '',
      searchFields: {
        survey: '',
      },
      headers: [],
    };
  },
  computed: {
    items() {
      if (this.parsed) {
        return this.parsed.data;
      }
      return [];
    },
  },
  watch: {
    excludeMeta() {
      this.createHeaders();
    },
  },
  methods: {
    hello(value, field) {
      this.searchFields[field] = value;
    },
    createCustomFilter(field) {
      return (value, search, item) => {
        if (!this.searchFields[field]) {
          return true;
        }

        return value.toLowerCase().startsWith(this.searchFields[field].toLowerCase());
      };
    },
    createHeaders() {
      const headers = [];
      if (this.parsed) {
        this.parsed.meta.fields.forEach((header) => {
          if (this.excludeMeta && header.startsWith('meta')) {
            return;
          }
          this.$set(this.searchFields, header, '');
          headers.push({ text: header, value: header, filter: this.createCustomFilter(header) });
        });
      }
      this.headers = headers;
    },
    async fetchData() {
      const r = await api.get('/submissions?survey=5e3038dbea0cf40001aef63b&format=csv');
      this.parsed = papa.parse(r.data, { header: true });
      this.createHeaders();
    },
  },
  async created() {
    this.fetchData();
  },
};
</script>

<style scoped>
/* https://vue-loader.vuejs.org/guide/scoped-css.html#child-component-root-elements */
.v-data-table >>> td {
  font-family: monospace;
}
</style>
