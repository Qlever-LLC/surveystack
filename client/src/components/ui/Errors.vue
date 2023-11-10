<template>
  <div>
    <v-dialog v-model="show" max-width="350">
      <a-card class="pa-4" dark color="red">
        <v-card-title class="headline">{{ title }}</v-card-title>
        <template v-for="(error, idx) in errors">
          <div :key="'error_' + idx">
            <v-card-text
              ><span style="font-weight: bold">{{ error.title }}</span> {{ error.body }}
            </v-card-text>
          </div>
        </template>
      </a-card>
    </v-dialog>
  </div>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
export default {
  components: {
    ACard,
  },
  props: {
    value: Boolean,
    errors: Array,
    title: String,
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
