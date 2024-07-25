<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';

const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const store = useStore();

if (store.getters['auth/isLoggedIn']) {
  if (mobile.value) {
    router.push({ name: 'groups' });
  } else {
    router.push({ name: 'my-groups-list' });
  }
} else {
  //redirect not logged-in users to all-groups-list
  router.push({ name: 'all-groups-list', query: { login: true } });
}
</script>

<style scoped lang="scss"></style>
