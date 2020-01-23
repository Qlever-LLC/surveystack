<template>
  <div>
    <h1>Submissions</h1>
    <ul v-if="results" class="list-group">
      <li v-for="(result, i) in results" :key="i" class="list-group-item">
        <small class="text-muted">{{result._id}}</small>
        <div v-for="(control, i) in result.data" :key="i">
          <tree-item class="item" :item="control" />
        </div>
      </li>
    </ul>
  </div>
</template>


<script>
import api from '@/services/api.service';
import treeItem from '@/components/survey/TreeItem.vue';

// <tree-item class="item" :item="result" @make-folder="makeFolder" @add-item="addItem" />

export default {
  components: {
    treeItem,
  },
  data() {
    return {
      results: [],
    };
  },
  async created() {
    try {
      const { survey } = this.$route.query;
      const { data } = await api.get(`/submissions?survey=${survey}`);
      console.log(data);
      this.results = data;
    } catch (e) {
      console.log('something went wrong:', e);
    }
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
