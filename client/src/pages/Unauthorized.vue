<template>
  <a-container class="bg-background rounded">
    <h1>Access denied</h1>
    Only {{ allowed }} are allowed on <strong>{{ to }}</strong
    >. Goodbye!
  </a-container>
</template>

<script>
export default {
  props: {
    allowed: {
      type: String,
      default: 'Super Admins',
    },
    to: {
      type: String,
      default: '??',
    },
  },
};
</script>
