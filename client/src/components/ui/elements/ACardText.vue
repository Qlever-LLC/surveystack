<template>
  <v-card-text
    @click="$emit('click', $event)"
    :class="{
      maxHeight500px: cssMaxHeight500px,
      paddingBottom2px: cssPaddingBottom2px,
      dialogContent: cssDialogContent,
    }"
    :disabled="disabled"
  >
    <slot />
  </v-card-text>
</template>

<script>
export default {
  emits: ['click'],
  props: {
    //non vuetify props
    cssDialogContent: { type: Boolean, required: false },
    cssMaxHeight500px: { type: Boolean, required: false },
    cssPaddingBottom2px: { type: Boolean, required: false },
    //vuetify props
    disabled: { type: Boolean, required: false },
  },
};
</script>

<style scoped>
.maxHeight500px {
  max-height: 500px;
}

.paddingBottom2px {
  padding-bottom: 2px;
}

.dialog-content {
  min-height: 400px;
  max-height: calc(80% - 200px);
  padding: 12px 16px;
}
.dialog-content > :first-child {
  padding-right: 24px !important;
}
.dialog-content >>> .row-cell {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dialog-content >>> .draggable {
  display: flex;
  flex-direction: column;
  justify-items: start;
  align-items: stretch;
}
.dialog-content >>> .draggable .row-cell {
  margin-top: 8px;
}
</style>
