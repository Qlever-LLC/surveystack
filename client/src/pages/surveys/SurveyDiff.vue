<template>
  <v-treeview v-model="tree" :open="initiallyOpen" :items="items" activatable open-on-click>
    <template v-slot:prepend="{ item }">
      <v-icon :color="item.color">
        {{ item.icon }}
      </v-icon>
    </template>
  </v-treeview>
</template>

<script>
import api from '@/services/api.service';
import { createControlInstance, availableControls } from '@/utils/surveyConfig';

export default {
  data() {
    return {
      diff: null,
    };
  },

  computed: {
    json() {
      return JSON.stringify(this.diff, null, 2);
    },
    items() {
      if (!this.diff) {
        return [];
      }

      const childrenOf = (parent) => this.diff.filter((d) => d.newParentId === parent); //TODO sort
      const findIcon = (control) => {
        const match = availableControls.find((c) => c.type === control.type);
        return match ? match.icon : '';
      };
      const changeColors = {
        changed: 'amber',
        added: 'green',
        removed: 'red',
      };
      const convert = (diffs) => {
        return diffs.map((controlDiff) => {
          const control = controlDiff.newControl || controlDiff.oldControl;
          return {
            controlDiff,
            id: control._id,
            name: control.name,
            icon: findIcon(control),
            color: changeColors[controlDiff.changeType],
            changeType: controlDiff.changeType,
            children: convert(childrenOf(control.id)),
          };
        });
      };
      return convert(childrenOf(null));
    },
  },

  async created() {
    try {
      const { id, oldVersion, newVersion } = this.$route.params;
      const { data } = await api.get(`/surveys/diff/${id}/${oldVersion}/${newVersion}`);
      console.log('GOT DATA', data);
      this.diff = data;
    } catch (err) {
      console.log('Error fetching diff:', err);
    }
  },
};
</script>
