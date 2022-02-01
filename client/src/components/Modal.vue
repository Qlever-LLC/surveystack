<template>
  <div class="modal" v-if="isModalOpen(header.value, item._id)" role="dialog">
    <div class="overlay" @click.stop="closeModal()" data-testid="overlay"></div>
    <div class="modal-content">
      <span class="black--text">{{ item[header.value] }}</span>
    </div>
  </div>
</template>
<script>
export default {};
</script>
<style scoped>
.modal {
  height: 0;
  width: 0;
}
.modal-content {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  background-color: white;
  width: 100%;
  padding: 0.5rem;
  white-space: initial;
  position: absolute;
  z-index: 1;
  min-height: 40px;
  max-height: 100px;
  width: 400px;
  overflow: scroll;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
