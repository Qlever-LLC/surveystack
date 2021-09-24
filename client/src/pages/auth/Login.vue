<template>
  <div class="wrapper">
    <div class="py-3 px-2">
      <v-img
        v-if="isWhitelabel"
        :src="$store.getters['whitelabel/partner'].hero || $store.getters['whitelabel/partner'].logo"
        contain
        height="128"
      />
      <v-img v-else :src="require('../../assets/surveystack_temp_logo.svg')" contain height="128" />
    </div>
    <div class="d-flex justify-center">
      <app-login :useLink="true" />
    </div>
  </div>
</template>

<script>
import AppLogin from '@/components/ui/Login.vue';
import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';

const DEFAULT_ENTITY = {
  email: '',
  password: '',
};

export default {
  components: {
    AppLogin,
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      status: '',
      showPasswords: false,
      entity: {
        ...DEFAULT_ENTITY,
      },
      invitation: '',
      membership: null,
      registrationEnabled: false,
    };
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    registerLink() {
      const link = {
        name: 'auth-register',
        params: {
          initialEmail: this.entity.email,
          initialPassword: this.entity.password,
        },
      };

      if (this.$route.params && this.$route.params.redirect) {
        link.params.redirect = this.$route.params.redirect;
      }

      if (this.invitation) {
        link.query = { invitation: this.invitation };
      }
      return link;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    hasInvitation() {
      return this.$store.getters['invitation/hasInvitation'];
    },
  },
  async created() {
    if (this.initialEmail) {
      this.entity.email = this.initialEmail;
    }

    const { invitation } = this.$route.query;
    this.invitation = invitation;
    if (invitation) {
      this.$store.dispatch('invitation/set', invitation);
      const {
        data: [membership],
      } = await api.get(`/memberships?invitationCode=${invitation}&populate=true`);
      this.membership = membership;
    }

    // console.log('created', this.isWhitelabel);

    if (this.isWhitelabel) {
      const { data } = await api.get(`/groups/${this.whitelabelPartner.id}`);
      if (!data.meta.invitationOnly) {
        this.registrationEnabled = true;
      }
    } else {
      this.registrationEnabled = true;
    }

    // magic link login
    const { cfs, email, token, group } = this.$route.query;
    if (cfs) {
      await this.$store.dispatch('auth/login', {
        url: '/auth/login',
        user: { email: email.replace(/ /g, '+'), token }, // TODO: find a better solution for + signs
      });

      this.$store.dispatch('surveys/fetchPinned');
      await autoSelectActiveGroup(this.$store, group);
      this.$router.replace({ name: 'surveys-detail', params: { id: cfs } });
    }
  },
  methods: {
    reset() {
      this.entity = { ...DEFAULT_ENTITY };
    },
  },
};
</script>

<style scoped>
.wrapper {
  background-color: var(--v-background-base);
  height: 100%;
}
</style>
