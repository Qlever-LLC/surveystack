<template>
  <div class="px-4 d-flex" id="draft-breadcrumbs">
    <a-chip dark small class="mr-0 mr-1" v-if="breadcrumbs.length > 0">
      <span v-for="(crumb, ci) in breadcrumbs" :key="`bread_${ci}`">
        {{ crumb }}
        <span class="mr-1" v-if="ci < breadcrumbs.length - 1"> &gt; </span>
      </span>
    </a-chip>
  </div>
</template>

<script>
import AChip from '@/components/ui/AChip.vue';
export default {
  components: {
    AChip,
  },
  props: ['breadcrumbs'],
};
</script>

<style scoped></style>
