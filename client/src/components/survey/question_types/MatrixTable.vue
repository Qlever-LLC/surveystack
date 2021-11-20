<template>
  <div class="wrap" :style="cssVariables">
    <div ref="header" class="mt-heading mt-row">
      <div
        class="caption font-weight-bold text--secondary px-4 mt-cell mt-header mt-divider"
        v-for="(header, colIdx) in headers"
        :key="colIdx"
        :style="colStyles[colIdx]"
      >
        <div class="mt-full" :class="{ 'mt-fix-left': fixCols[colIdx] }">
          <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
            {{ colIdx }}
          </slot>
        </div>
      </div>
      <div :style="headerLeftSpacerStyles" />
    </div>
    <v-virtual-scroll ref="body" v-scroll.self="onScroll" :items="rowsWithId" height="300" item-height="64">
      <template v-slot="{ item }">
        <div class="mt-row">
          <div
            class="px-1 mt-cell  mt-divider"
            v-for="(header, colIdx) in headers"
            :key="colIdx"
            :style="colStyles[colIdx]"
          >
            <div class="mt-full" :class="{ 'mt-fix-left': fixCols[colIdx] }">
              <slot name="row-cell" v-bind:header="header" v-bind:row="item" v-bind:colIdx="colIdx">
                {{ ' / ' + colIdx }}
              </slot>
            </div>
          </div>
          <div
            v-if="$scopedSlots['row-actions']"
            class="mt-fixed-right px-1 mt-cell flex-grow-0 flex-shrink-0"
            :style="actionBlockStyles"
          >
            <div class="mt-fix-right mt-fill mt-divider d-flex align-center">
              <slot name="row-actions" v-bind:rowIdx="item.id"> </slot>
            </div>
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
  props: {
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    rowActionsWidth: {
      type: Number,
      default: 0, // TODO validate: required if actions slot set
    },
  },
  data() {
    return {
      verticalScrollbarWidth: 0,
      scrollLeft: 0,
      scrollRight: 0,
    };
  },
  computed: {
    rowsWithId() {
      return this.rows.map((row, id) => ({ ...row, id }));
    },
    fixCols() {
      return [true];
    },
    colStyles() {
      return this.headers.map(({ scaleWidth = 100, type }) => ({
        flexBasis: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
      }));
    },
    actionBlockStyles() {
      return {
        flexBasis: `${this.rowActionsWidth}px`,
        flexGrow: 0,
        flexShrink: 0,
      };
    },
    stickRight() {
      return {
        transform: `translateX(-${this.scrollRight}px)`,
      };
    },
    stickLeft() {
      return {
        transform: `translateX(${this.scrollLeft}px)`,
      };
    },
    headerLeftSpacerStyles() {
      return {
        flexBasis: `${this.rowActionsWidth + this.verticalScrollbarWidth}px`,
        flexGrow: 0,
        flexShrink: 0,
      };
    },
    cssVariables() {
      return {
        '--mt-scroll-left': `${this.scrollLeft}px`,
        '--mt-scroll-right': `${-this.scrollRight}px`,
      };
    },
  },
  methods: {
    onScroll(e) {
      this.$refs.header.scrollLeft = e.target.scrollLeft;
      this.scrollLeft = e.target.scrollLeft;
      const scrollLeftMax = e.target.scrollWidth - e.target.clientWidth;
      this.scrollRight = scrollLeftMax - e.target.scrollLeft;
    },
  },
  watch: {
    rows() {
      this.$nextTick(() => {
        // TODO is this the best way to do this?
        const { offsetWidth, clientWidth } = this.$refs.body.$el;
        this.verticalScrollbarWidth = offsetWidth - clientWidth;
      });
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
}

.mt-row {
  display: flex;
  flex-wrap: nowrap;
}

.mt-cell {
  flex-shrink: 0;
  flex-grow: 1;
}

.mt-header {
  height: 48px;
  line-height: 48px;
}

.mt-divider {
  border-bottom-color: rgba(0, 0, 0, 0.12);
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-spacing: 0;
  box-sizing: border-box;
}

.mt-heading {
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 1;
  overflow-x: hidden;
}

.mt-fill {
  width: 100%;
  height: 100%;
  background-color: whitesmoke;
}

.mt-fix-right {
  transform: translateX(var(--mt-scroll-right));
}

.mt-fix-left {
  transform: translateX(var(--mt-scroll-left));
  /* keep it above the other input cells */
  z-index: 1;
  position: relative;
}
</style>
