<template>
  <v-dialog :value="value" @input="(v) => $emit('input', v)" width="500" max-width="75%">
    <v-card>
      <v-card-title>
        List library consumers {{ libraryConsumers !== null ? '(' + libraryConsumers.length + ')' : '' }}
      </v-card-title>
      <a-divider />
      <v-card-text>
        <a-list dense style="max-height: 500px" class="overflow-y-auto">
          <v-container v-if="libraryConsumers === null" class="d-flex align-center justify-center" style="height: 100%">
            <v-progress-circular :size="50" color="primary" indeterminate />
          </v-container>
          <template v-if="libraryConsumers !== null">
            <v-list-item v-for="c in libraryConsumers" :key="c._id" @click="goToSurvey(c._id)">
              <v-list-item-content>
                <small class="grey--text">{{ c._id }}</small>
                <v-list-item-title>{{ c.name }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </a-list>
      </v-card-text>
      <a-divider />
      <v-card-actions>
        <a-spacer />
        <v-btn @click="$emit('cancel')" color="primary" text> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { reactive, toRefs } from '@vue/composition-api';
import api from '@/services/api.service';

export default {
  name: 'list-library-consumers-dialog',
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    librarySurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['ok', 'cancel'],
  setup(props) {
    const state = reactive({
      libraryConsumers: null,
    });

    loadLibraryConsumers();

    async function loadLibraryConsumers() {
      const response = await api.get(`/surveys/list-library-consumers?id=${props.librarySurvey._id}`);
      state.libraryConsumers = response.data;
    }
    function goToSurvey(survey_id) {
      let route = this.$router.resolve(`/surveys/${survey_id}`);
      window.open(route.href, '_blank');
    }

    return {
      ...toRefs(state),
      goToSurvey,
    };
  },
};
</script>
<style scoped>
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
