<template>
  <div>
    <v-breadcrumbs :items="links" :class="noPadding ? 'pa-0' : ''">
      <template v-slot:divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
      <template v-slot:item="{ item }">
        <v-breadcrumbs-item :to="item.to" :exact="item.exact" :disabled="disabled">
          {{ item.text }}
        </v-breadcrumbs-item>
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
    disabled: {
      type: Boolean,
      default: false,
    },
    disabledSuffix: {
      type: String,
      default: null,
    },
    noPadding: {
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
