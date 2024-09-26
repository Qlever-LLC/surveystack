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
          :modelValue="state.entity.email.toLowerCase()"
          @update:modelValue="state.entity.email = $event.toLowerCase()"
          color="focus"
          hint="Choose an email address you will not lose access to.  Changing an email address later may cause some integrations to not work." />

        <a-text-field label="Name" type="text" class="form-control" v-model="state.entity.name" color="focus" />

        <a-text-field
          label="Password"
          :type="passwordInputType"
          class="form-control"
          v-model="state.entity.password"
          :append-inner-icon="state.showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:appendInner="state.showPasswords = !state.showPasswords"
          color="focus" />

        <div class="linkBlock d-flex justify-space-around align-center">
          <router-link v-if="props.useLink" :to="signInLink" class="font-weight-medium" role="link">
            Already have an account?
          </router-link>
          <a v-else @click.stop="$emit('updateActive', 'login')" class="font-weight-medium" role="button">
            Already have an account?
          </a>
          <a-btn type="submit" @click.prevent="submit" color="primary" class="signUpCSS px-8"> Sign up </a-btn>
        </div>
      </a-form>
      <a-alert class="mt-4" variant="outlined" v-if="state.membership" type="info"
        >Your code is eligible to join <strong>{{ state.membership.group.name }}</strong></a-alert
      >

      <a-alert v-if="state.status" class="mt-4" mode="fade" variant="text" type="error">{{ state.status }} </a-alert>
    </a-card>
  </a-container>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { redirectAfterLogin, autoJoinWhiteLabelGroup } from '@/utils/memberships';

const { mobile } = useDisplay();
const store = useStore();
const router = useRouter();
const route = useRoute();

const DEFAULT_ENTITY = {
  email: '',
  name: '',
  password: '',
};

const props = defineProps({
  initialEmail: {
    type: String,
    required: false,
  },
  useLink: {
    type: Boolean,
    default: true,
  },
  redirect: {
    type: String,
    required: false,
  },
});

const state = reactive({
  status: '',
  showPasswords: false,
  entity: { ...DEFAULT_ENTITY },
  membership: null,
});

const passwordInputType = computed(() => {
  return state.showPasswords ? 'text' : 'password';
});
const passwordShowHideText = computed(() => {
  return state.showPasswords ? 'Hide passwords' : 'Show passwords';
});
const signInLink = computed(() => {
  const link = { name: 'auth-login', query: {} };
  if (props.redirect) {
    link.query.redirect = props.redirect;
  }
  if (props.initialEmail) {
    link.query.initialEmail = props.initialEmail;
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

async function submit() {
  state.status = '';

  if (state.entity.email === '') {
    state.status = 'Email must not be empty.';
    return;
  }

  if (state.entity.password === '') {
    state.status = 'Password must not be empty.';
    return;
  }

  try {
    await store.dispatch('auth/login', {
      url: '/auth/register',
      user: state.entity,
    });
    //make sure whitelabel user is a member of its whitelabel group (this reflects legacy behaviour, though it's not clear why this had been added in the past)
    //TODO in case of autoJoinWhiteLabelGroup throwing an error, registration should maybe reverted
    const partnerGroupId = await autoJoinWhiteLabelGroup(store);
    //change route
    await redirectAfterLogin(store, router, mobile, props.redirect, partnerGroupId);
  } catch (error) {
    switch (error.response?.status) {
      case 409:
        state.status = error.response.data.message;
        break;
      case 400:
        state.status = error.response.data.message;
        break;
      default:
        state.status = 'Unknown error :/';
    }
  }
}
function reset() {
  state.entity = { ...DEFAULT_ENTITY };
}

async function onCreation() {
  if (props.initialEmail) {
    state.entity.email = props.initialEmail;
  }
}
</script>

<style scoped lang="scss">
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
