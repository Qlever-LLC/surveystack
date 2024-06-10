<template>
  <app-dialog
    v-model="state.learnMoreDialog"
    title="Premium Features"
    @confirm="state.learnMoreDialog = false"
    @cancel="state.learnMoreDialog = false">
    <p>
      With a paid subscription you can upgrade to
      <strong>your own white-labelled app</strong> with a <strong>custom url</strong>, and your
      <strong>branding</strong> and <strong>color scheme</strong>. You will also benefit from more administrative tools
      to improve project and data management:
    </p>
    <ul class="my-3 revertPadding">
      <li>Allow any user to join your group from your custom url.</li>
      <li>See all your group and pinned surveys without being logged in to your app.</li>
      <li>
        Automatically associate data submitted to your custom url to your group so that you have proper administrative
        controls over data privacy.
      </li>
    </ul>
    <p>
      To learn more about paid subscriptions please contact Dan TerAvest (<a href="mailto:dan@our-sci.net"
        >dan@our-sci.net</a
      >) or Greg Austic (<a href="mailto:greg@our-sci.net">greg@our-sci.net</a>)
    </p>
  </app-dialog>

  <form @submit.prevent="onSubmit" autocomplete="off">
    <a-text-field
      label="Name"
      placeholder="Enter group name"
      id="group-name"
      autocomplete="off"
      v-model="state.entity.name" />
    <a-text-field
      label="Slug"
      placeholder="Enter group slug or use suggested"
      id="group-slug"
      v-model="state.entity.slug"
      :readonly="!state.editSlug"
      :append-inner-icon="state.editSlug ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
      autocomplete="off"
      @click:appendInner="state.editSlug = !state.editSlug"
      hint="URL friendly version of name"
      persistent-hint
      :disabled="isWhitelabel() && state.entity.path === getWhitelabelPartner().path" />
    <div class="d-flex align-center mt-6">
      <a-checkbox
        label="Invitation Only"
        v-model="state.entity.meta.invitationOnly"
        :hideDetails="false"
        :hint="
          state.entity.meta.invitationOnly
            ? 'Users can only join through an invitation'
            : 'Everybody may join this group'
        "
        persistentHint
        :disabled="!state.isPremium"
        class="d-inline mt-0" />
      <div class="ml-auto ml-sm-6">
        <a-btn small v-if="!state.isPremium" @click="state.learnMoreDialog = true" variant="outlined" color="primary"
          >Learn more...
        </a-btn>
      </div>
    </div>
    <a-checkbox label="Archived" v-model="state.entity.meta.archived" />
    <div class="d-flex justify-end pa-2">
      <a-btn v-if="!state.editMode" variant="text" @click="cancel">Cancel</a-btn>
      <a-btn color="primary" type="submit">{{ state.editMode ? 'Save' : 'Create' }}</a-btn>
    </div>
  </form>
</template>

<script setup>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';
import { handleize } from '@/utils/groups';
import { SPEC_VERSION_GROUP } from '@/constants';
import { computed, reactive, watch } from 'vue';
import { useGroup } from '@/components/groups/group';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { isWhitelabel, getWhitelabelPartner } = useGroup();

const props = defineProps({
  scope: {
    type: String,
    required: true,
    validator(value) {
      return ['edit', 'new'].includes(value);
    },
  },
});

const emit = defineEmits(['changed']);

const state = reactive({
  editSlug: false,
  editMode: props.scope === 'edit',
  entity: {
    meta: {
      archived: false,
      specVersion: SPEC_VERSION_GROUP,
      invitationOnly: true,
    },
    name: '',
    slug: '',
    dir: '/',
    path: '',
    surveys: {
      pinned: [],
    },
  },
  learnMoreDialog: false,
  isLoadingGroup: false,
  isPremium: computed(() => {
    if (
      isWhitelabel() &&
      (state.entity.path.startsWith(getWhitelabelPartner().path) ||
        state.entity.dir.startsWith(getWhitelabelPartner().path))
    ) {
      return true;
    }
    return false;
  }),
});

initData();

async function initData() {
  const { dir } = route.query;
  if (dir) {
    state.entity.dir = dir;
    if (!state.entity.dir.endsWith('/')) {
      state.entity.dir += '/';
    }
  }

  if (state.editMode) {
    state.isLoadingGroup = true;
    try {
      const { id } = route.params;
      const { data } = await api.get(`/groups/${id}?populate=true`);
      state.entity = { ...state.entity, ...data };
    } catch (e) {
      console.log('something went wrong:', e);
    } finally {
      state.isLoadingGroup = false;
    }
  }
}

async function onSubmit() {
  if (state.entity.name.trim() === '') {
    console.log('name must not be empty');
    return;
  }

  if (state.entity.slug.trim() === '') {
    console.log('slug must not be empty');
    return;
  }

  try {
    if (state.editMode) {
      await api.put(`/groups/${state.entity._id}`, state.entity);
      emit('changed', state.entity);
    } else {
      const { data: newGroup } = await api.post('/groups', state.entity);
      state.entity = newGroup;
      //reload user memberships
      const user = store.getters['auth/user'];
      await store.dispatch('memberships/getUserMemberships', user._id);
      await router.push(`/groups/${state.entity._id}/settings`);
    }
  } catch (err) {
    await store.dispatch('feedback/add', err.response.data.message);
    console.log(err);
  }
}

function cancel() {
  router.back();
}
watch(
  () => state.entity.name,
  (newValue) => {
    if (!state.editMode) {
      const handle = handleize(newValue);
      state.entity.slug = handle;
    }
  }
);

watch(
  () => state.entity.slug,
  (newValue) => {
    if (!state.editMode) {
      const handle = handleize(newValue);
      state.entity.slug = handle;
    }
  }
);
</script>

<style scoped lang="scss">
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}

.revertPadding {
  padding: revert;
}
</style>
