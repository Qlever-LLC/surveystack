<template>
  <div
    class="px-4"
    id="draft-breadcrumbs"
  >
    <v-chip
      dark
      small
      color="red"
      class="mr-0 mr-1"
      v-if="breadcrumbs.length > 0"
    ><span
        v-for="(crumb, ci) in breadcrumbs"
        :key="`bread_${ci}`"
      >{{ crumb }} <span
          class="mr-1"
          v-if="ci < breadcrumbs.length - 1"
        >&gt;</span></span></v-chip>
  </div>
</template>

<script>
export default {
  props: [
    'breadcrumbs',
  ],
};
</script>

<style scoped>

</style>
