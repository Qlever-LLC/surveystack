<template>
  <!-- <v-treeview
    v-model="tree"
    :open="initiallyOpen"
    :items="items"
    activatable
    item-key="name"
    open-on-click
  >
    <template v-slot:prepend="{ item, open }">
      <v-icon v-if="!item.file">
        {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
      </v-icon>
      <v-icon v-else>
        {{ files[item.file] }}
      </v-icon>
    </template>
  </v-treeview> -->
  <v-treeview :items="items"></v-treeview>
</template>

<script>
import api from '@/services/api.service';

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
      const convert = (controls) => {
        return controls.map((control) => ({
          id: control.newControl._id,
          name: control.newControl.name,
          children: control.newControl.children ? convert(control.newControl.children) : null,
        }));
      };
      return convert(this.diff);
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
