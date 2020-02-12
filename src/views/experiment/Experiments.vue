<template>
  <div id="app">
    <splitpanes class="default-theme">
      <pane min-size="20">1<br /><em class="specs">I have a min width of 20%</em></pane>
      <pane>
        <splitpanes
          class="default-theme"
          horizontal="horizontal"
        >
          <pane min-size="15">2<br /><em class="specs">I have a min height of 15%</em></pane>
          <pane>3</pane>
          <pane>4</pane>
        </splitpanes>
      </pane>
      <pane>5</pane>
    </splitpanes>
  </div>
</template>

<script>

import { Splitpanes, Pane } from 'splitpanes';
import draftFooter from '@/components/survey/drafts/DraftFooter.vue';


export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    draftFooter,
    Splitpanes,
    Pane,
  },
  data() {
    return ({
      slide: 'slide-in',
      show: false,
    });
  },
};
</script>
