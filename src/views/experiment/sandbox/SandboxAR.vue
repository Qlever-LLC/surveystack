<template>
  <v-container>
    <h1>Andreas' Sandbox</h1>
    <v-data-table
      :headers="headers"
      :items="items"
    />
  </v-container>
</template>

<script>
import axios from 'axios';
import papa from 'papaparse';

export default {
  data() {
    return {
      csv: null,
      parsed: null,
    };
  },
  computed: {
    headers() {
      const headers = [];
      if (this.parsed) {
        this.parsed.meta.fields.forEach((header) => {
          headers.push({ text: header, value: header });
        });
      }
      console.log('headers', headers);

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
