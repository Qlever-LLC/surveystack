<template>
  <v-dialog v-model="isVisible" width="300">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on:click.prevent="on.click" small> Confirm </v-btn>
    </template>

    <a-card>
      <v-card-title> Confirm Membership </v-card-title>
      <a-card-text>
        This will immediately activate the membership of the user "{{ email }}". They will receive an email with login
        instructions. You'll be able to send "Call for Submission" links to this user.
      </a-card-text>
      <a-card-actions>
        <v-spacer />
        <v-btn text @click="isVisible = false"> Cancel </v-btn>
        <v-btn text color="primary" @click="send" :loading="isInProgress"> Confirm </v-btn>
      </a-card-actions>
    </a-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';
import { get } from 'lodash';
import ACard from '@/components/ui/ACard.vue';
import ACardActions from '@/components/ui/ACardActions.vue';
import ACardText from '@/components/ui/ACardText.vue';

export default {
  components: {
    ACard,
    ACardActions,
    ACardText,
  },
  data() {
    return {
      isVisible: false,
      resolve: null,
      next: null,
      isInProgress: false,
    };
  },
  props: {
    membershipId: {
      required: true,
      type: String,
    },
    email: {
      required: true,
      type: String,
    },
  },
  methods: {
    async send() {
      this.isInProgress = true;
      try {
        await api.post('/memberships/activate-by-admin', { membershipId: this.membershipId });
        this.$emit('confirmed');
      } catch (e) {
        console.error(e);
        this.$store.dispatch('feedback/add', get(e, 'response.data.message', String(e)));
      } finally {
        this.isVisible = false;
        this.isInProgress = false;
      }
    },
  },
};
</script>
