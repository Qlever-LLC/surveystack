<template>
  <a-container>
    <a-card class="pa-6 pa-sm-12">
      <h1 class="text-heading" v-if="isWhitelabel">Join {{ whitelabelPartner.name }}</h1>
      <h1 class="text-heading" v-else>Join SurveyStack</h1>
      <a-form>
        <a-text-field
          label="E-Mail"
          type="text"
          class="form-control"
          :modelValue="entity.email.toLowerCase()"
          @update:modelValue="entity.email = $event.toLowerCase()"
          color="focus"
          hint="Choose an email address you will not lose access to.  Changing an email address later may cause some integrations to not work."
        />

        <a-text-field label="Name" type="text" class="form-control" v-model="entity.name" color="focus" />

        <a-text-field
          label="Password"
          :type="passwordInputType"
          class="form-control"
          v-model="entity.password"
          :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
          color="focus"
        />

        <div class="linkBlock d-flex justify-space-around align-center">
          <router-link v-if="useLink" :to="signInLink" class="font-weight-medium" role="link">
            Already have an account?
          </router-link>
          <a v-else text @click.stop="$emit('updateActive', 'login')" class="font-weight-medium" role="button">
            Already have an account?
          </a>
          <a-btn type="submit" @click.prevent="submit" color="primary" class="signUpCSS px-8"> Sign up </a-btn>
        </div>
      </a-form>
      <a-alert class="mt-4" outlined v-if="membership" type="info"
        >Your code is eligible to join <strong>{{ membership.group.name }}</strong></a-alert
      >

      <a-alert v-if="status" class="mt-4" mode="fade" text type="error">{{ status }}</a-alert>
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';

import { autoSelectActiveGroup } from '@/utils/memberships';

const DEFAULT_ENTITY = {
  email: '',
  name: '',
  password: '',
};

export default {
  data() {
    return {
      status: '',
      showPasswords: false,
      entity: { ...DEFAULT_ENTITY },
      membership: null,
    };
  },
  props: {
    initialEmail: {
      type: String,
      required: false,
    },
    useLink: {
      type: Boolean,
      default: true,
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

      return link;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  methods: {
    async submit() {
      this.status = '';

      if (this.entity.email === '') {
        this.status = 'Email must not be empty.';
        return;
      }

      if (this.entity.password === '') {
        this.status = 'Password must not be empty.';
        return;
      }

      try {
        await this.$store.dispatch('auth/login', {
          url: '/auth/register',
          user: this.entity,
        });

        // try to auto join group if this is a whitelabel
        if (this.isWhitelabel) {
          try {
            await api.post(`/memberships/join-group?id=${this.whitelabelPartner.id}`);
            await autoSelectActiveGroup(this.$store, this.whitelabelPartner.id);
          } catch (error) {
            console.log(error.response.data.message);
          }
        }

        if (this.$route.params.redirect) {
          this.$router.push(this.$route.params.redirect);
        } else {
          this.$store.dispatch('surveys/fetchPinned');
          this.$router.push('/');
        }
      } catch (error) {
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
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}

.linkBlock {
  flex-direction: column-reverse;
}
.signUpCSS {
  margin-bottom: 16px;
  margin-left: 0px;
}

@media (min-width: 425px) {
  .linkBlock {
    flex-direction: row;
  }
  .signUpCSS {
    margin-bottom: 0px;
    margin-left: 16px;
  }
}
</style>
