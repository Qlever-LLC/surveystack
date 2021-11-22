<template>
  <div class="wrap" :style="cssVariables">
    <div ref="header" class="mt-heading mt-divider mt-row">
      <div
        class="caption font-weight-bold text--secondary mt-cell mt-header"
        v-for="(header, colIdx) in headers"
        :key="colIdx"
        :style="colStyles[colIdx]"
      >
        <div class="white px-4" :class="isFixColumn(colIdx) ? `mt-fix-left elevation-${scrollLeft === 0 ? 0 : 3}` : ''">
          <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
            {{ colIdx }}
          </slot>
        </div>
      </div>
      <div :style="headerLeftSpacerStyles" />
    </div>
    <v-virtual-scroll ref="body" v-scroll.self="onScroll" :items="rows" height="300" item-height="64">
      <template v-slot="{ item }">
        <div class="mt-row mt-divider">
          <div class="mt-cell" v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
            <div
              class="mt-fill d-flex align-center white px-1"
              :class="isFixColumn(colIdx) ? `mt-fix-left elevation-${scrollLeft === 0 ? 0 : 3}` : ''"
            >
              <slot name="row-cell" v-bind:header="header" v-bind:row="item" v-bind:colIdx="colIdx">
                {{ ' / ' + colIdx }}
              </slot>
            </div>
          </div>
          <div
            v-if="$scopedSlots['row-actions']"
            class="mt-row-actions mt-fixed-right ml-1 mt-cell flex-grow-0 flex-shrink-0"
          >
            <div
              class="mt-fix-right mt-fill mt-divider d-flex align-center white"
              :class="`elevation-${scrollRight === 0 ? 0 : 3}`"
            >
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
    fixedColumns: {
      type: Number,
      default: 0,
    },
    rowActionsWidth: {
      type: Number,
      default: 0, // TODO validate: required if actions slot set
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    rowHeight: {
      type: Number,
      default: 64,
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
    colStyles() {
      return this.headers.map(({ scaleWidth = 100, type }) => ({
        flexBasis: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
      }));
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
        '--mt-row-actions-width': `${this.rowActionsWidth}px`,
        '--mt-row-height': this.rowHeight,
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
    isFixColumn(colIdx) {
      return !this.isMobile && this.fixedColumns > colIdx;
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
  height: calc(var(--mt-row-height) * 1px);
}

.mt-cell {
  flex-shrink: 0;
  flex-grow: 0;
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
  transition: box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.mt-fix-right {
  transform: translateX(var(--mt-scroll-right));
  clip-path: inset(0px 0px 0px -5px);
}

.mt-fix-left {
  transform: translateX(var(--mt-scroll-left));
  clip-path: inset(0px -5px 0px 0px);
  /* keep it above the other input cells */
  z-index: 1;
  position: relative;
}

.mt-row-actions {
  flex-basis: var(--mt-row-actions-width);
  flex-grow: 0;
  flex-shrink: 0;
}
</style>
