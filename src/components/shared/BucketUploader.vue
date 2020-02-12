<!-- App.vue -->

<!-- HTML Template -->
<template>
  <div>
    <!--UPLOAD-->
    <form
      enctype="multipart/form-data"
      novalidate
      class="h-100"
    >
      <div class="dropbox">
        <input
          type="file"
          multiple
          :name="uploadFieldName"
          :disabled="isSaving"
          @change="filesChange($event.target.name, $event.target.files); fileCount = $event.target.files.length"
          accept="image/*"
          class="input-file"
        />
        <div class="text-center p-3">
          Drag your files here
          <br />or click to browse
        </div>
        <p v-if="isSaving">Uploading {{ fileCount }} files...</p>
      </div>
    </form>
  </div>
</template>

<!-- Javascript -->
<script>
import { upload } from '@/services/fileupload.service';

const STATUS_INITIAL = 0;
const STATUS_SAVING = 1;
const STATUS_SUCCESS = 2;
const STATUS_FAILED = 3;

export default {
  name: 'app-bucket-uploader',
  props: ['directory'],
  data() {
    return {
      uploadedFiles: [],
      uploadError: null,
      currentStatus: null,
      uploadFieldName: 'media',
    };
  },
  computed: {
    isInitial() {
      return this.currentStatus === STATUS_INITIAL;
    },
    isSaving() {
      return this.currentStatus === STATUS_SAVING;
    },
    isSuccess() {
      return this.currentStatus === STATUS_SUCCESS;
    },
    isFailed() {
      return this.currentStatus === STATUS_FAILED;
    },
  },
  methods: {
    reset() {
      // reset form to initial state
      this.currentStatus = STATUS_INITIAL;
      this.uploadedFiles = [];
      this.uploadError = null;
    },
    save(formData) {
      // upload data to the server
      this.currentStatus = STATUS_SAVING;

      upload(`/bucket${this.directory}`, formData)
        .then((x) => {
          this.uploadedFiles = [].concat(x);
          this.currentStatus = STATUS_SUCCESS;
          this.$emit('uploaded', x);
        })
        .catch((err) => {
          this.uploadError = err.response;
          this.currentStatus = STATUS_FAILED;
        });
    },
    filesChange(fieldName, fileList) {
      // handle file changesmedia
      const formData = new FormData();

      if (!fileList.length) return;

      // append the files to FormData
      Array.from(Array(fileList.length).keys()).forEach((x) => {
        formData.append(fieldName, fileList[x], fileList[x].name);
      });

      // save it
      this.save(formData);
    },
  },
  mounted() {
    this.reset();
  },
};
</script>

<!-- SASS styling -->
<style lang="scss">
.dropbox {
  outline: 2px dashed lightgrey; /* the dash box */
  outline-offset: -6px;
  background: lightcyan;
  color: dimgray;
  position: relative;
  cursor: pointer;
  height: 100%;
}

.input-file {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  cursor: pointer;
}

.dropbox:hover {
  background: rgb(
    203,
    255,
    255
  ); /* when mouse over to the drop zone, change color */
}
</style>
