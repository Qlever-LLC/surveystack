<template>
  <app-register v-if="activeComponent === 'register'" @updateActive="updateComp" :useLink="false" />
  <app-forgot-password v-else-if="activeComponent === 'forgot-password'" @updateActive="updateComp" :useLink="false" />
  <app-login v-else @updateActive="updateComp" :useLink="false" skippable @skip="$emit('skip')" />
</template>

<script>
import AppLogin from '@/components/ui/Login.vue';
import AppRegister from '@/components/ui/Register.vue';
import AppForgotPassword from '@/components/ui/ForgotPassword.vue';

export default {
  components: {
    AppLogin,
    AppRegister,
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
