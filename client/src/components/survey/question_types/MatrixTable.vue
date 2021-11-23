<template>
  <div class="wrap" :style="cssVariables">
    <div ref="header" class="mt-heading mt-divider mt-row">
      <div
        class="mt-cell mt-header caption font-weight-bold text--secondary"
        v-for="(header, colIdx) in headers"
        :key="colIdx"
        :style="colStyles[colIdx]"
      >
        <div
          class="white px-4 d-flex flex-nowrap"
          :class="{ 'mt-fix-left-elevation': colIdx === fixedColumns - 1, 'mt-follow-scroll-x': !isFixColumn(colIdx) }"
        >
          <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
            {{ colIdx }}
          </slot>
        </div>
      </div>
      <div :style="headerLeftSpacerStyles" />
    </div>
    <!-- <v-virtual-scroll ref="body" v-scroll.self="onScrollX" :items="rowsWithId" height="300" item-height="64"> -->
    <!-- <template v-slot="{ item }"> -->
    <div ref="body" v-scroll.self="onScrollX" :style="{ overflowX: 'auto', overflowY: 'hidden' }">
      <div v-for="item in rowsWithId" :key="item.id">
        <div class="mt-row" @click="isMobile && $emit('showEditDialog', item.id)">
          <div class="mt-cell" v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
            <div class="mt-fill d-flex align-center white px-1" :class="leftFixClasses(colIdx)">
              <slot name="row-cell" v-bind:header="header" v-bind:row="item" v-bind:colIdx="colIdx">
                {{ ' / ' + colIdx }}
              </slot>
            </div>
          </div>
          <div
            v-if="$scopedSlots['row-actions']"
            class="mt-row-actions mt-fixed-right ml-1 mt-cell flex-grow-0 flex-shrink-0"
          >
            <div class="mt-fix-right mt-fill d-flex align-center white" :class="{ 'mt-elevated': scrollRight !== 0 }">
              <slot name="row-actions" v-bind:rowIdx="item.id"> </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- </template> -->
    <!-- </v-virtual-scroll> -->

    <div class="mt-fix-bottom py-4 mb-8" :style="{pointerEvents: 'none'}">
      <v-btn @click="$emit('addRow')" color="primary" :style="{pointerEvents: 'auto'}"> <v-icon left>mdi-plus</v-icon>{{ addRowLabel }} </v-btn>
    </div>
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
    addRowLabel: {
      type: String,
      default: 'Add row',
    },
  },
  data() {
    return {
      verticalScrollbarWidth: 0,
      scrollLeft: 0,
      scrollRight: 0,
      isHeaderFloating: false,
    };
  },
  computed: {
    rowsWithId() {
      return this.rows.map((row, id) => ({ ...row, id }));
    },
    colStyles() {
      return this.headers.map(({ scaleWidth = 100, type }) => ({
        flexBasis: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
        minWidth: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
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
      const sideElevationShadow = '0px 0px 2px 2px rgba(0, 0, 0, 0.18)';
      const topElevationShadow = '0px 0px 2px 0px rgba(0, 0, 0, 0.18)';
      return {
        '--mt-scroll-left': `${this.scrollLeft}px`,
        '--mt-scroll-right': `${this.scrollRight}px`,
        '--mt-left-fix-shadow': this.scrollLeft === 0 ? '' : sideElevationShadow,
        '--mt-right-fix-shadow': this.scrollRight === 0 ? '' : sideElevationShadow,
        '--mt-top-fix-shadow': this.isHeaderFloating ? topElevationShadow : '',
        '--mt-row-actions-width': `${this.rowActionsWidth}px`,
        '--mt-row-height': this.rowHeight,
      };
    },
  },
  methods: {
    onScrollX() {
      const body = this.$refs.body;
      this.scrollLeft = body.scrollLeft;
      const scrollLeftMax = body.scrollWidth - body.clientWidth;
      this.scrollRight = scrollLeftMax - body.scrollLeft;
    },
    onScrollY() {
      const { top } = this.$el.getBoundingClientRect();
      this.isHeaderFloating = top < 0;
    },
    isFixColumn(colIdx) {
      return !this.isMobile && this.fixedColumns > colIdx;
    },
    leftFixClasses(colIdx) {
      if (!this.isFixColumn(colIdx)) {
        return '';
      }
      return {
        'mt-fix-left': true,
        'mt-fix-left-elevation': true,
        'mt-elevated': this.scrollLeft !== 0,
      };
    },
  },
  watch: {
    rows() {
      this.$nextTick(() => {
        // TODO is this the best way to do this?
        const { offsetWidth, clientWidth } = this.$refs.body;
        this.verticalScrollbarWidth = offsetWidth - clientWidth;
      });
    },
  },
  mounted() {
    this.onScrollX()
    this.onScrollY()
    document.addEventListener('scroll', this.onScrollY)
  }
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
  height: 48px;
  position: sticky;
  top: 0;
  /* should be above the all the input cells and actions */
  z-index: 2;
  overflow: hidden;
  box-shadow: var(--mt-top-fix-shadow);

  clip-path: inset(0px 0px -5px 0px);
}

.mt-fix-bottom {
  position: sticky;
  /* floating footer size */
  bottom: 68px;
  /* should be above all input cells */
  z-index: 2;
}

.mt-fill {
  width: 100%;
  height: 100%;
  transition: box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.mt-fix-right {
  position: relative;
  right: var(--mt-scroll-right);
  clip-path: inset(0px 0px 0px -5px);
}

.mt-fix-left {
  position: relative;
  left: var(--mt-scroll-left);
}

.mt-fix-left-elevation {
  box-shadow: var(--mt-left-fix-shadow);
  clip-path: inset(0px -5px 0px 0px);
  /* should be above non-fixed input cells */
  z-index: 1;
  position: relative;
}

.mt-follow-scroll-x {
  position: relative;
  left: calc(var(--mt-scroll-left) * -1);
}

.mt-row-actions {
  flex-basis: var(--mt-row-actions-width);
  flex-grow: 0;
  flex-shrink: 0;
}

.mt-elevated {
  box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.18);
}
</style>
