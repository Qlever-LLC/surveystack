<template>
  <div>
    <v-breadcrumbs :items="links">
      <template v-slot:divider>
        <a-icon>mdi-chevron-right</a-icon>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
  props: {
    path: {
      type: String,
      default: '/',
    },
    disabledSuffix: {
      type: String,
      default: null,
    },
  },
  computed: {
    links() {
      const splits = this.path.split('/');
      const len = splits.length - 1;

      const links = [];

      for (let i = 0; i < len; i++) {
        splits.pop();
        links.push({
          to: `/g${splits.join('/')}`,
        });
      }

      links.reverse();

      // create text
      links.forEach((link) => {
        /* eslint-disable no-param-reassign */
        link.text = link.to.split('/').pop() || '/';
        link.exact = true;
      });

      links[0] = {
        to: '/groups',
        exact: true,
        text: 'groups',
      };

      if (this.disabledSuffix) {
        links.push({ disabled: true, exact: true, text: this.disabledSuffix });
      }

      return links;
    },
  },
};
</script>

<style scoped>
.v-breadcrumbs {
  padding-left: 0px;
}
</style>
