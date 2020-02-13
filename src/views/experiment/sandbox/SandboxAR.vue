<template>
  <v-container>
    <h1>Andreas' Sandbox</h1>
    <app-bucket-uploader />
  </v-container>
</template>

<script>
import appBucketUploader from '@/components/shared/BucketUploader.vue';

export default {
  components: {
    appBucketUploader,
  },
  data() {
    return {
      text: '',
    };
  },
};
</script>
