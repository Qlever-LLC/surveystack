<template>
  <v-breadcrumbs :items="links">
    <template v-slot:divider>
      <a-icon>mdi-chevron-right</a-icon>
    </template>
  </v-breadcrumbs>
</template>

<script>
export default {
  props: {
    path: {
      type: String,
      default: '/',
    },
    disabledSuffix: {
      type: String,
      default: null,
    },
    enableAll: {
      type: Boolean,
      default: false,
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

      // create title
      links.forEach((link) => {
        /* eslint-disable no-param-reassign */
        link.title = link.to.split('/').pop() || '/';
        link.exact = true;
        if (this.enableAll) {
          link.disabled = false;
        }
      });

      links[0] = {
        to: '/groups/all',
        exact: true,
        title: 'groups',
      };

      if (this.disabledSuffix) {
        links.push({ disabled: true, exact: true, title: this.disabledSuffix });
      }
      return links;
    },
  },
};
</script>

<style scoped lang="scss">
.v-breadcrumbs {
  padding-left: 0px;
}
</style>
