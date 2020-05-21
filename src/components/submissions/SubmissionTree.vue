<template>
  <v-container>
    <div class="text-right text--secondary"><small>total {{submissions.pagination.total}} records</small></div>
    <v-card class="pa-3">
      <ul
        v-if="submissions.content.length > 0"
        class="list-group"
      >
        <li
          v-for="submission in submissions.content"
          :key="submission._id"
          class="list-group-item pa-2"
        >
          <small class="grey--text text--darken-1">{{submission._id}}</small>
          <small
            v-if="submission.meta && submission.meta.path"
            class="grey--text text--darken-1"
          >, {{submission.meta.path}}</small>
          <div
            v-for="(item, name, i) in submission.data"
            :key="i"
          >
            <tree-item
              class="item"
              :item="item"
              :name="name"
            />
          </div>
        </li>
      </ul>
    </v-card>
  </v-container>
</template>

<script>
import treeItem from '@/components/survey/TreeItem.vue';


export default {
  props: ['submissions'],
  components: {
    treeItem,
  },
};
</script>

<style scoped>
body {
  font-family: Menlo, Consolas, monospace;
  color: #444;
}
.item {
  cursor: pointer;
}
.bold {
  font-weight: bold;
}
ul {
  padding-left: 1em;
  line-height: 1.5em;
  list-style-type: dot;
}
</style>
