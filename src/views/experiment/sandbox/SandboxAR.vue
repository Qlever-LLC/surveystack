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
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-row>
              <v-col>
                <v-toolbar-title>Simple CSV</v-toolbar-title>
              </v-col>
              <v-col>
                <v-text-field
                  v-model="search"
                  append-icon="mdi-search"
                  label="Search"
                  single-line
                  autocomplete="off"
                />
              </v-col>
              <v-col :cols="2">
                <v-switch
                  v-model="excludeMeta"
                  label="Hide meta"
                  class="mt-2"
                ></v-switch>
              </v-col>
            </v-row>

          </v-toolbar>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<script>
import axios from 'axios';
import papa from 'papaparse';

export default {
  data() {
    return {
      excludeMeta: true,
      csv: null,
      parsed: null,
      search: '',
    };
  },
  computed: {
    headers() {
      const headers = [];
      if (this.parsed) {
        this.parsed.meta.fields.forEach((header) => {
          if (this.excludeMeta && header.startsWith('meta')) {
            return;
          }
          headers.push({ text: header, value: header });
        });
      }
      return headers;
    },
    items() {
      if (this.parsed) {
        return this.parsed.data;
      }
      return [];
    },
  },
  async created() {
    const r = await axios.get('http://localhost:3000/debug/submissions?survey=5e3038dbea0cf40001aef63b');
    console.log('r.data', r.data);
    this.parsed = papa.parse(r.data, { header: true });
    console.log(this.parsed);
  },
};
</script>
