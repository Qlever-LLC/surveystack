<template>
  <div class="text-grey">
    <p class="pt-4 pl-4">
      Version:
      <router-link to="/app/info" class="text-decoration-none" style="color: grey !important"
        >{{ lcl.shortHash }}
      </router-link>
    </p>
  </div>
</template>
<script setup>
const lcl = JSON.parse(process.env.VUE_APP_LCL);
</script>
