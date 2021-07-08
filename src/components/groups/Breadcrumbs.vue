<template>
  <div>
    <v-breadcrumbs :items="links">
      <template v-slot:divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script>
export default {
  props: {
    path: {
      type: String,
      default: '/',
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
