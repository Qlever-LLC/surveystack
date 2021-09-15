<template>
  <v-container v-if="isLoggedIn" class="maxw-40">
    <app-feedback title="Shapeshift:" type="info" v-if="showFeedback && isShapeshifting" @closed="showFeedback = false">
      You are currently shapeshifting...
      <a href="/shapeshift?mode=off" class="text-info" @click.prevent="$store.dispatch('auth/leaveShapeshift')"
        >Click to return as '{{ $store.state.auth.shapeshiftUser.email }}'</a
      >
    </app-feedback>
    <h1>Profile</h1>
    <p class="mt-4 mb-6">
      You are logged in as
      <strong>{{ user.email }}</strong
      >.
    </p>

    <active-group-selector class="my-4" v-model="activeGroup" outlined />

    <div class="d-flex justify-end">
      <v-btn text @click="goToEditSelf">Edit</v-btn>
      <v-btn color="primary" @click="logout">Logout</v-btn>
    </div>
  </v-container>
  <v-container v-else>
    <h1>Profile</h1>
    You are not logged in... <router-link to="/auth/login">Go to Login</router-link>
  </v-container>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';

export default {
  components: {
    appFeedback,
    ActiveGroupSelector,
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    user() {
      return this.$store.getters['auth/user'];
    },
    isShapeshifting() {
      return this.$store.getters['auth/isShapeshifting'];
    },
    activeGroup: {
      get() {
        return this.$store.getters['memberships/activeGroup'];
      },
      set(val) {
        this.$store.dispatch('memberships/setActiveGroup', val);
      },
    },
  },
  methods: {
    async logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/auth/login');
    },
    goToEditSelf() {
      // eslint-disable-next-line
      const id = this.$store.state.auth.user._id;
      this.$router.push(`/users/${id}/edit`);
    },
  },
  data() {
    return {
      showFeedback: true,
    };
  },
};
</script>
