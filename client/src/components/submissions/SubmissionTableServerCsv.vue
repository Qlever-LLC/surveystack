<template>
  <v-container fluid>
    <h1>Andreas' Sandbox</h1>
    <v-card class="pt-2">
      <v-data-table
        :headers="headers"
        :items="items"
        show-select
        item-key="_id"
        :search="search"
        :mobile-breakpoint="0"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-row>
              <v-col>
                <v-toolbar-title>Simple CSV</v-toolbar-title>
              </v-col>
              <v-col>
                <a-text-field v-model="search" append-icon="mdi-search" label="Search" single-line autocomplete="off" />
              </v-col>
              <v-col :cols="2">
                <a-switch v-model="excludeMeta" label="Hide meta" class="mt-2" />
              </v-col>
            </v-row>
          </v-toolbar>
        </template>
        <template v-slot:header="{ props: { headers } }">
          <thead>
            <tr>
              <th v-for="(header, i) in headers" :key="header.text">
                <a-text-field v-if="i > 0" @input="(v) => hello(v, header.text)" />
              </th>
            </tr>
          </thead>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import papa from 'papaparse';
import api from '@/services/api.service';
import ATextField from '@/components/ui/ATextField.vue';

export default {
  components: {
    ATextField,
  },
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
      // this.$set(this.searchFields, field, value);

      console.log(field);
      console.log(value);
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

/*
.v-data-table >>> .v-label {
  font-size: 12px;
}
*/
</style>
