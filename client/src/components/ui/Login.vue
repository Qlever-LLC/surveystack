<template>
  <a-card v-if="!state.signInLinkSent" class="pa-6 card-width">
    <div class="d-sm-flex justify-center">
      <div class="pl-sm-5 pr-sm-10 py-6">
        <h1 class="text-heading text-center" v-if="isWhitelabel">Login &amp; Join {{ whitelabelPartner.name }}</h1>
        <h1 class="text-heading" v-else>Welcome Back!</h1>
        <a-form>
          <a-text-field
            label="E-Mail"
            type="text"
            class="form-control"
            v-model="state.entity.email"
            @update:model-value="state.entity.email = $event.toLowerCase()"
            color="focus" />
          <div v-if="!state.usePassword" class="font-italic text-body-2 mb-4">
            We'll send you an email to sign you in - no password needed! <b>Click send</b> then <b>check your email</b>.
          </div>
          <a-text-field
            v-if="state.usePassword"
            label="Password"
            :type="passwordInputType"
            class="form-control"
            v-model="state.entity.password"
            :append-inner-icon="state.showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:appendInner="state.showPasswords = !state.showPasswords"
            color="focus" />
          <div class="d-flex justify-space-around align-center">
            <template v-if="state.usePassword">
              <router-link
                v-if="props.useLink"
                :to="{
                  name: 'auth-forgot-password',
                  query: { email: state.entity.email },
                }"
                class="white-space-nowrap font-weight-medium mr-4"
                role="link"
                >Forgot password?</router-link
              >
              <a
                v-else
                @click.stop="$emit('updateActive', 'forgot-password')"
                class="white-space-nowrap font-weight-medium mr-4"
                role="button"
                >Forgot password?</a
              >
            </template>
            <a-btn type="submit" @click.prevent="handleSubmitClick" color="primary" :loading="state.isSubmitting">{{
              state.usePassword ? 'Login' : 'Send Link'
            }}</a-btn>
          </div>
        </a-form>
        <div class="text-center text-muted mt-5">
          <a-btn variant="text" small color="primary" @click="switchSignInMode" data-testid="toggle-method">
            {{ state.usePassword ? 'email me a sign in link instead' : 'sign in with password instead' }}
          </a-btn>
        </div>
      </div>
      <template v-if="state.registrationEnabled">
        <div class="d-flex flex-sm-column align-center justify-space-around" data-testid="separator">
          <div class="line"></div>
          Or
          <div class="line"></div>
        </div>
        <div class="d-flex justify-center pr-sm-5 pl-sm-10 py-6 d-flex flex-column align-center flex-wrap">
          <p class="white-space-nowrap">Don't have an account?</p>
          <a-btn v-if="props.useLink" :to="registerLink" color="primary" class="px-8" role="link"> Register now </a-btn>
          <a-btn v-else @click.stop="$emit('updateActive', 'register')" color="primary" class="px-8" role="button">
            Register now
          </a-btn>
        </div>
      </template>
    </div>

    <div class="align-self-end">
      <a-btn v-if="props.skippable" @click.stop="$emit('skip')" color="primary" class="no-uppercase" variant="text">
        or skip
      </a-btn>
    </div>

    <a-alert v-if="state.status" class="mt-4" mode="fade" variant="text" type="error">{{ state.status }}</a-alert>
  </a-card>
  <a-alert
    v-else
    icon="mdi-email-fast"
    prominent
    border-color="success"
    color="success"
    border="start"
    elevation="2"
    class="card-width mb-0">
    <h1>Magic link sent!</h1>
    <p class="body-1 my-6">
      Follow the link we sent you at <span class="font-weight-medium">{{ state.entity.email }}</span> to finish logging
      in!
    </p>
    <div class="text-right text-muted mt-5">
      <a-btn variant="text" small @click="state.signInLinkSent = false"> Back to login </a-btn>
    </div>
  </a-alert>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import api from '@/services/api.service';
import { get } from 'lodash';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { autoJoinWhiteLabelGroup, redirectAfterLogin } from '@/utils/memberships';

const { mobile } = useDisplay();
const store = useStore();
const router = useRouter();
const route = useRoute();

const DEFAULT_ENTITY = {
  email: '',
  password: '',
};

// LocalStorage key for saving the preferred login method
const LS_DEFAULT_USE_PASSWORD = 'use-password-on-login-page-by-default';

const props = defineProps({
  initialEmail: {
    type: String,
    required: false,
  },
  // true: start with user/pw login, false: start with magic link login
  defaultUsePassword: {
    type: Boolean,
    default: null,
  },
  useLink: {
    type: Boolean,
    default: true,
  },
  skippable: {
    type: Boolean,
    default: false,
  },
  redirect: {
    type: String,
    required: false,
  },
  landingPath: {
    type: String,
    required: false,
  },
  callbackUrl: {
    type: String,
    required: false,
  },
});

const state = reactive({
  status: '',
  showPasswords: false,
  entity: {
    ...DEFAULT_ENTITY,
  },
  registrationEnabled: false,
  usePassword:
    props.defaultUsePassword !== null ? props.defaultUsePassword : localStorage[LS_DEFAULT_USE_PASSWORD] === 'true',
  signInLinkSent: false,
  isSubmitting: false,
});

const passwordInputType = computed(() => {
  return state.showPasswords ? 'text' : 'password';
});
const registerLink = computed(() => {
  const link = {
    name: 'auth-register',
    query: {
      initialEmail: state.entity.email,
      initialPassword: state.entity.password,
    },
  };
  if (props.redirect) {
    link.query.redirect = props.redirect;
  }

  return link;
});
const isWhitelabel = computed(() => {
  return store.getters['whitelabel/isWhitelabel'];
});
const whitelabelPartner = computed(() => {
  return store.getters['whitelabel/partner'];
});

onCreation();

async function onCreation() {
  if (props.initialEmail) {
    state.entity.email = props.initialEmail;
  }

  if ('magicLinkExpired' in props) {
    state.status = 'Your magic link is expired. Please request a new one.';
    // Select the magic link login variation of the dialog
    state.usePassword = false;
  }

  if (isWhitelabel.value) {
    const { data } = await api.get(`/groups/${whitelabelPartner.value.id}`);
    if (!data.meta.invitationOnly) {
      state.registrationEnabled = true;
    }
  } else {
    state.registrationEnabled = true;
  }
}

function switchSignInMode() {
  state.usePassword = !state.usePassword;
  state.status = null;
}
async function handleSubmitClick() {
  state.isSubmitting = true;
  try {
    await submit();
  } finally {
    state.isSubmitting = false;
  }
}
async function submit() {
  if (state.entity.email === '') {
    state.status = 'E-Mail must not be empty.';
    return;
  }

  // email sign-in link
  if (!state.usePassword) {
    const landingPath = props.redirect || props.landingPath;
    const callbackUrl = props.callbackUrl;

    try {
      await store.dispatch('auth/sendMagicLink', { email: state.entity.email, landingPath, callbackUrl });
      state.signInLinkSent = true;
      state.status = '';
    } catch (e) {
      state.status = get(e, 'response.data.message') || 'An error occurred, please try again later.';
    }
    return;
  }

  if (state.entity.password === '') {
    state.status = 'Password must not be empty.';
    return;
  }

  try {
    await store.dispatch('auth/login', {
      url: '/auth/login',
      user: state.entity,
    });

    //make sure whitelabel user is a member of its whitelabel group (this reflects legacy behaviour, though it's not clear why this had been added in the past)
    const partnerGroupId = await autoJoinWhiteLabelGroup(store);
    //change route
    await redirectAfterLogin(store, router, mobile, props.redirect, partnerGroupId);
  } catch (error) {
    switch (error.response?.status) {
      case 401:
        state.status = 'Invalid email or password'; //error.response.data.message;
        break;
      case 404:
        state.status = 'Invalid email or password'; //error.response.data.message;
        break;
      default:
        state.status = 'An error occurred'; //'Unknown error :/';
    }
    return;
  }
}

watch(
  () => state.usePassword,
  (newValue) => {
    localStorage[LS_DEFAULT_USE_PASSWORD] = newValue;
  }
);
</script>

<style scoped lang="scss">
a {
  text-decoration: none;
}

.line {
  border-top: 2px solid rgb(180, 180, 180);
  width: 40%;
  margin-top: -1px;
}
.card-width {
  max-width: min(700px, 92vw);
}
@media (min-width: 600px) {
  .line {
    /* reset previous values */
    border-top: none;
    width: auto;
    margin-top: 0;
    border-left: 2px solid rgb(180, 180, 180);
    height: 40%;
    margin-left: -1px;
  }
}
.no-uppercase {
  text-transform: unset !important;
}
</style>
