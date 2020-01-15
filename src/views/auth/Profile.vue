<template>
  <div v-if="isLoggedIn">
    <app-feedback
      title="Shapeshift:"
      type="info"
      v-if="showFeedback && isShapeshifting"
      @closed="showFeedback = false"
    >
      You are currently shapeshifting...
      <a
        href="/shapeshift?mode=off"
        class="text-info"
        @click.prevent="$store.dispatch('auth/leaveShapeshift')"
      >Click to return as '{{$store.state.auth.shapeshiftUser.username}}'</a>
    </app-feedback>
    <h2>Login successful</h2>
    <h4>
      You are logged in as
      <strong>{{ user.username }}</strong>.
    </h4>

    <div class="mt-2">
      <v-btn class="btn btn-primary mr-2" @click="goToEditSelf">Edit</v-btn>
      <v-btn class="btn btn-primary" @click="logout">Logout</v-btn>
    </div>
  </div>
  <div v-else>You are not logged in.</div>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';

export default {
  components: {
    appFeedback,
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
  },
  methods: {
    async logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/auth/login');
    },
    goToEditSelf() {
      // eslint-disable-next-line
      const id = this.$store.state.auth.user._id;
      this.$router.push(`/users/edit/${id}`);
    },
  },
  data() {
    return {
      showFeedback: true,
    };
  },
};
</script>
