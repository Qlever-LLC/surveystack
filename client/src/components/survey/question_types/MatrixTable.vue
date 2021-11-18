<template>
  <div class="wrap">
    <div ref="header" class="mt-heading row">
      <div class="track" v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
        <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
          {{ colIdx }}
        </slot>
      </div>
    </div>

    <v-virtual-scroll v-scroll.self="onScroll" :items="rowsWithId" height="300" item-height="64">
      <template v-slot="{ item }">
        <div class="row">
          <div v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
            <slot name="row-cell" v-bind:header="header" v-bind:row="item" v-bind:colIdx="colIdx">
              {{ ' / ' + colIdx }}
            </slot>
          </div>
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script>
function defaultColumnWidth(type) {
  switch (type) {
    case 'farmos_planting':
    case 'farmos_field':
      return 240;
    default:
      return 160;
  }
}
export default {
  // components: {
  //   RecycleScroller
  // },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
  },
  computed: {
    rowsWithId() {
      return this.rows.map((row, id) => ({ ...row, id }));
    },
    colStyles() {
      return this.headers.map(({ scaleWidth = 100, type }) => ({
        flexBasis: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
        flexShrink: 0,
      }));
    },
  },
  methods: {
    onScroll(e) {
      console.log(e.target.scrollLeft);
      this.$refs.header.scrollLeft = e.target.scrollLeft;
    },
  },
};
</script>

<style scoped>
.vue-recycle-scroller {
  height: 300px;
  overflow: auto;
}
.wrap {
  position: relative;
  /* margin: 10em auto 30em; */
  /* max-width: 960px; */
  /* overscroll-behavior: contain; */
}

.row {
  display: flex;
  flex-wrap: nowrap;
}

.headers {
  top: 0;
  position: -webkit-sticky;
  position: sticky;
  z-index: 1;
}

.tracks,
.scroller {
  display: flex;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.scroller {
  overflow-x: hidden;
}

.tracks {
  overflow: auto;
  scroll-snap-type: x mandatory;
}

.scenes::-webkit-scrollbar,
.scroller::-webkit-scrollbar {
  display: none;
}

.track {
  flex: 1 0 calc(22% + 2px);
  scroll-snap-align: start;
}

.track + .track {
  margin-left: -1px;
}

.mt-heading {
  height: 50px;
  /* display: flex; */
  /* justify-content: center; */
  /* align-items: center; */
  /* position: -webkit-sticky; */
  position: sticky;
  top: 0;
  /* border: solid #fff; */
  /* border-width: 0 1px; */
  z-index: 1;
  background: #efefef;
  font-weight: 700;
  overflow-x: hidden;
}

.entry {
  border: 1px solid #ebebeb;
  border-top: 0;
  background: #fff;
  height: 8em;
  padding: 1em;
}

@media (max-width: 767px) {
  .track {
    flex: 1 0 calc(50% + 7px);
  }
}
</style>
