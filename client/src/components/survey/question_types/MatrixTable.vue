<template>
  <div class="wrap">
    <div class="headers">
      <div class="scroller">
        <div class="track" v-for="(header, colIdx) in headers" :key="colIdx">
          <div class="mt-heading">
            <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
              {{ colIdx }}
            </slot>
          </div>
        </div>
      </div>
    </div>
    <div class="tracks">
      <div class="track" v-for="(header, colIdx) in headers" :key="colIdx">
        <div class="entry" v-for="(row, rowIdx) in rows" :key="rowIdx">
          <slot name="row-cell" v-bind:header="header" v-bind:row="row" v-bind:colIdx="colIdx">
            {{ rowIdx + ' / ' + colIdx }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
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
};
</script>

<style scoped>
.wrap {
  position: relative;
  margin: 10em auto 30em;
  max-width: 960px;
  overscroll-behavior: contain;
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  border: solid #fff;
  border-width: 0 1px;
  z-index: 1;
  background: #efefef;
  font-weight: 700;
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
