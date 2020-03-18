<template>
  <div>
    <v-card class="py-2">
      <v-data-table
        :headers="headers"
        :items="items"
        show-select
        item-key="_id"
        :search="search"
        :mobile-breakpoint="NaN"
        hide-default-footer
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-row>
              <v-col>
                <div class="d-flex justify-end">
                  <v-switch
                    v-model="excludeMeta"
                    label="Hide meta"
                    class="mt-2"
                  ></v-switch>
                </div>
              </v-col>
            </v-row>
          </v-toolbar>
        </template>

      </v-data-table>
    </v-card>

  </div>
</template>

<script>
import papa from 'papaparse';
import csvService from '@/services/csv.service';

export default {
  props: {
    submissions: {
      type: Object,
    },
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
    submissions() {
      console.log('submissions have changed');
      this.fetchData();
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
      if (!this.submissions) {
        return;
      }
      this.csv = csvService.createCsv(this.submissions.content);
      this.parsed = papa.parse(this.csv, { header: true });
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
