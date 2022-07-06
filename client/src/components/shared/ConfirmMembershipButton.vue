  <template>
  <v-dialog v-model="isVisible" persistent width="300">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on:click.prevent="on.click"> Confirm </v-btn>
    </template>

    <v-card>
      <v-card-title> Confirm Membership </v-card-title>
      <v-card-text>
        This will immediately activate the membership of the user "{{ email }}". They will receive an email with login
        instructions. You'll be able to send "Call for Submission" links to this user.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="isVisible = false"> Cancel </v-btn>
        <v-btn text color="primary" @click="send" :loading="isInProgress"> Confirm </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api.service';

export default {
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
        this.$store.dispatch('feedback/add', e.response.data.message);
      } finally {
        this.isVisible = false;
        this.isInProgress = false;
      }
    },
  },
};
</script>
