<template>
  <div id="root">
    <div id="header"></div>
    <div id="content"></div>
    <draft-footer
      id="footer"
      showPrev="true"
      enableNext="false"
      showSubmit="false"
      showNav="true"
    />
  </div>
</template>

<script>

import draftFooter from '@/components/survey/drafts/DraftFooter.vue';


export default {
  components: {
    draftFooter,
  },
  data() {
    return ({
      slide: 'slide-in',
      show: false,
    });
  },
};
</script>

<style scoped>
#root {
  position: absolute;
  height: 100%;
  width: 100%;
  padding: 0px;
  margin: 0px;
  left: 0;
  top: 0;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
}

#root > div {
  grid-column: 1;
}
#header {
  grid-row: 1;
}
#content {
  grid-row: 2;
}
#footer {
  grid-row: 3;
}
</style>
