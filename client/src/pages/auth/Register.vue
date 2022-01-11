<template>
  <div class="wrapper">
    <register :useLink="true" class="maxw-40" />
  </div>
</template>

<script>
import api from '@/services/api.service';

import { autoSelectActiveGroup } from '@/utils/memberships';

import Register from '@/components/ui/Register.vue';

const DEFAULT_ENTITY = {
  email: '',
  name: '',
  password: '',
};

export default {
  components: {
    Register,
  },
  data() {
    return {
      status: '',
      passwordConfirmation: '',
      showPasswords: false,
      entity: { ...DEFAULT_ENTITY },
      invitation: '',
      membership: null,
    };
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
  },
  computed: {
    passwordInputType() {
      return this.showPasswords ? 'text' : 'password';
    },
    passwordShowHideText() {
      return this.showPasswords ? 'Hide passwords' : 'Show passwords';
    },
    signInLink() {
      const link = { name: 'auth-login', params: {} };

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
  methods: {
    async submit() {
      this.status = '';
      console.log('submitting');

      if (this.entity.email === '') {
        this.status = 'Email must not be empty.';
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      if (this.entity.password !== this.passwordConfirmation) {
        this.status = 'Passwords do not match.';
        return;
      }

      try {
        const user = await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.entity,
        });

        // try to auto join group if this is a whitelabel
        if (this.isWhitelabel) {
          try {
            const { data } = await api.post(`/memberships/join-group?id=${this.whitelabelPartner.id}`);
            await autoSelectActiveGroup(this.$store, this.whitelabelPartner.id);
          } catch (error) {
            console.log(error.response.data.message);
          }
        }

        if (this.$route.params.redirect) {
          this.$router.push(this.$route.params.redirect);
        } else if (this.hasInvitation) {
          this.$router.push({
            name: 'invitations',
            query: { code: this.$store.getters['invitation/code'] },
          });
        } else {
          this.$store.dispatch('surveys/fetchPinned');
          this.$router.push('/');
        }
      } catch (error) {
        console.log(error.response);
        switch (error.response.status) {
          case 409:
            this.status = error.response.data.message;
            break;
          case 400:
            this.status = error.response.data.message;
            break;
          default:
            this.status = 'Unknown error :/';
        }
      }
    },
    reset() {
      this.entity = { ...DEFAULT_ENTITY };
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
  },
};
</script>

<style scoped>
.wrapper {
  background-color: var(--v-background-base);
  height: 100%;
}
</style>
