<template>
  <app-forgot-password v-if="activeComponent === 'forgot-password'" @updateActive="updateComp" :useLink="false" />
  <app-login v-else @updateActive="updateComp" :useLink="false" />
</template>

<script>
import AppLogin from '@/components/ui/Login.vue';
import AppForgotPassword from '@/components/ui/ForgotPassword.vue';

export default {
  components: {
    AppLogin,
    AppForgotPassword,
  },
  props: {
    init: {
      type: String,
      default: 'login',
    },
  },
  model: {
    prop: 'activeComponent',
    event: 'change',
  },
  data() {
    return {
      loginIsVisible: this.$store.getters['auth/isLoggedIn'] || true,
      activeComponent: this.init,
    };
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
  },
  methods: {
    updateComp(newComp) {
      this.activeComponent = newComp;
      this.$emit('change', newComp);
    },
  },
};
</script>
