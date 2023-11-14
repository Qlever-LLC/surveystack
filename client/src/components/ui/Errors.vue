<template>
  <div>
    <v-dialog v-model="show" max-width="350">
      <a-card class="pa-4" dark color="red">
        <a-card-title class="headline">{{ title }}</a-card-title>
        <template v-for="(error, idx) in errors">
          <div :key="'error_' + idx">
            <a-card-text>
              <span style="font-weight: bold">{{ error.title }}</span> {{ error.body }}
            </a-card-text>
          </div>
        </template>
      </a-card>
    </v-dialog>
  </div>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardText,
    ACardTitle,
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
