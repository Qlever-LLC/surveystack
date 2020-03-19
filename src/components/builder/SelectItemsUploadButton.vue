<template>
  <div>
    <v-input>
      <label for="select-items-file-input" class="cursor-pointer">
        <v-btn class="pointer-events-none">
          <v-icon>mdi-upload</v-icon>
          Add CSV
        </v-btn>
      </label>
      <input
        type="file"
        id="select-items-file-input"
        ref="select-items-file-input"
        accept=".csv"
        class="d-none"
        @change="handleFileChange"
      />
    </v-input>
  </div>
</template>

<script>
import { parse } from 'papaparse';

export default {
  methods: {
    async handleFileChange({ target: { files: [file] } }) {
      console.log('handle file change');
      console.log(file);

      try {
        const data = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          // beforeFirstChunk(chunk) {
          //   const { index } = chunk.match(/\r\n|\r|\n/);
          //   const headings = chunk.substr(0, index).split(',');
          //   // headings[0] = 'newHeading';
          //   // headings.split
          //   return headings.join() + chunk.substr(index);
          // },
        });

        this.$emit('change', data);
        this.$refs['select-items-file-input'].value = null;
      } catch (err) {
        console.error('error parsing CSV file');
      }
    },
    itemIsValid(item) {
      // return [/label/].every(key => key));
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
