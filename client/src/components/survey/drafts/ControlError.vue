<template>
  <a-banner bgColor="red-lighten-2" class="mx-0 px-0">
    <div class="d-flex align-center">
      <a-icon small left>mdi-alert</a-icon>
      <div>
        <slot>Unknown error</slot>
      </div>
    </div>
  </a-banner>
</template>
<script>
export default {};
</script>
