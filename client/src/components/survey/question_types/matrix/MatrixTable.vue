<template>
  <div class="mt-wrap mt-vars" :style="cssVariables">
    <div ref="header" class="mt-heading mt-divider" :class="{ 'mt-elevation-shadow': isHeaderFloating }">
      <div
        v-for="(header, colIdx) in headers"
        class="caption font-weight-bold text--secondary mt-cell-wrap"
        :class="{
          'mt-fixed': fixColMask[colIdx],
          'mt-elevation-shadow': isLeftFloating && colIdx === fixedColumns - 1,
        }"
        :style="cellWidthStyles[colIdx]"
        :key="colIdx"
      >
        <div ref="headerCells" class="white px-4 d-flex flex-nowrap mt-cell" :style="{ position: 'relative' }">
          <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
            {{ colIdx }}
          </slot>
        </div>
      </div>
      <div v-if="$scopedSlots['row-actions']" class="mt-header-left-spacer" />
    </div>
    <div ref="body" class="mt-body pb-1" v-scroll.self="onScrollX" :style="{ overflowX: 'auto', overflowY: 'hidden' }">
      <div
        class="mt-row"
        v-for="(item, rowIdx) in rows"
        :key="rowIdx"
        @click="isMobile && $emit('showEditDialog', rowIdx)"
      >
        <div
          class="mt-cell-wrap"
          v-for="(header, colIdx) in headers"
          :key="colIdx"
          :class="{ 'mt-elevation-shadow': isLeftFloating && colIdx === fixedColumns - 1 }"
          :style="leftFixStyles[colIdx]"
        >
          <div class="mt-cell d-flex align-center white px-1">
            <slot
              v-if="shouldRenderCell(rowIdx, colIdx)"
              name="row-cell"
              v-bind:header="header"
              v-bind:row="item"
              v-bind:colIdx="colIdx"
            >
            </slot>
          </div>
        </div>
        <div
          v-if="$scopedSlots['row-actions']"
          class="mt-actions-wrap ml-1 mt-cell flex-grow-0 flex-shrink-0 white"
          :class="{ 'mt-elevation-shadow': isRightFloating }"
        >
          <div class="mt-actions d-flex align-center">
            <slot name="row-actions" v-bind:rowIdx="rowIdx"></slot>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-fix-bottom py-4 mb-8" :style="{ pointerEvents: 'none' }">
      <a-btn @click="$emit('addRow')" color="primary" :style="{ pointerEvents: 'auto' }">
        <v-icon left>mdi-plus</v-icon>{{ addRowLabel }}
      </a-btn>
    </div>
  </div>
</template>

<script>
import { sum, debounce } from 'lodash';
import ABtn from '@/components/ui/ABtn.vue';

function defaultColumnWidth(type) {
  switch (type) {
    case 'farmos_planting':
    case 'farmos_field':
    case 'dropdown':
      return 240;
    default:
      return 160;
  }
}
export default {
  components: { ABtn },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    // number of columns fixed to the left
    fixedColumns: {
      type: Number,
      default: 0,
    },
    // width of the row action column
    rowActionsWidth: {
      type: Number,
      default: 0,
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
    // how much sooner the bottom has to start floating to avoid being coverd by the footer
    floatingFooterSize: {
      type: Number,
      default: 68,
    },
    // (experimental optimization) skip rendering the cells that aren't visible on the screen
    // TODO test this on a device that has visible performance issues with large matrices
    dontRenderOffScreenCells: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isLeftFloating: false,
      isRightFloating: false,
      isHeaderFloating: false,
      cellVisibilityMask: [],
    };
  },
  computed: {
    colMinWidths() {
      return this.headers.map(({ scaleWidth = 100, type }) => defaultColumnWidth(type) * (scaleWidth / 100));
    },
    cellWidthStyles() {
      return this.colMinWidths.map((minWidth) => ({
        minWidth: `${minWidth}px`,
        flexBasis: `${minWidth}px`,
      }));
    },
    leftFixStyles() {
      return this.cellWidthStyles.map((style, colIdx) => {
        const newStyle = { ...style };
        if (this.fixColMask[colIdx]) {
          newStyle.position = 'sticky';
          newStyle.left = `${sum(this.colMinWidths.slice(0, colIdx))}px`;
          /* should be above non-fixed input cells */
          newStyle.zIndex = 1;
        }
        return newStyle;
      });
    },
    minRowWidth() {
      return sum(this.colMinWidths) + (this.isMobile ? 0 : this.rowActionsWidth);
    },
    // Combined width of fixed columns
    fixColsWidth() {
      return sum(this.colMinWidths.slice(0, this.fixedColumns));
    },
    // Boolean array where true means: the column on the same index is fixed to the left
    fixColMask() {
      return this.headers.map((_, colIdx) => !this.isMobile && this.fixedColumns > colIdx);
    },
    cssVariables() {
      return {
        '--mt-row-actions-width': `${this.rowActionsWidth}px`,
        '--mt-row-height': `${this.rowHeight}px`,
        '--mt-min-row-width': `${this.minRowWidth}px`,
        '--mt-floating-footer-size': `${this.floatingFooterSize}px`,
      };
    },
  },
  methods: {
    onScrollX() {
      // make sure it only runs once per RAF
      if (this.rafIdScrollX) {
        return;
      }

      this.rafIdScrollX = window.requestAnimationFrame(() => {
        const body = this.$refs.body;
        if (!body) {
          return;
        }

        this.isLeftFloating = !this.isMobile && body.scrollLeft > 0;
        const scrollLeftMax = body.scrollWidth - body.clientWidth;
        this.isRightFloating = !this.isMobile && scrollLeftMax > body.scrollLeft;

        this.$refs.headerCells.forEach((el, colIdx) => {
          el.style.left = `${this.fixColMask[colIdx] ? 0 : -body.scrollLeft}px`;
        });
        this.updateCellVisibilityMask();
        this.rafIdScrollX = null;
      });
    },
    onScrollY() {
      // make sure it only runs once per RAF
      if (this.rafIdScrollY) {
        return;
      }

      this.rafIdScrollY = window.requestAnimationFrame(() => {
        const { top } = this.$el.getBoundingClientRect();
        this.isHeaderFloating = top < 0;
        this.updateCellVisibilityMask();
        this.rafIdScrollY = null;
      });
    },
    shouldRenderCell(rowIdx, colIdx) {
      return (
        !this.dontRenderOffScreenCells || !this.cellVisibilityMask[rowIdx] || this.cellVisibilityMask[rowIdx][colIdx]
      );
    },
    // create a 2d boolean matrix where true marks the cells visible on the scren (experimenal)
    updateCellVisibilityMask: debounce(function () {
      if (!this.dontRenderOffScreenCells) {
        return;
      }
      const { width, top } = this.$el.getBoundingClientRect();
      const { scrollLeft } = this.$refs.body;
      const cols = this.headers.length;
      const rows = this.rows.length;

      const bufferColsPx = 300;
      const bufferRows = 3;

      let onScreenRow;
      if (this.minRowWidth > width) {
        const xStartPx = scrollLeft + this.fixColsWidth - bufferColsPx;
        const xEndPx = scrollLeft + width - this.rowActionsWidth + bufferColsPx;
        onScreenRow = [];
        let xAt = 0;
        this.colMinWidths.forEach((width, colIdx) => {
          const isVisible = xAt + width >= xStartPx && xAt <= xEndPx;
          onScreenRow.push(isVisible || this.fixColMask[colIdx]);
          xAt += width;
        });
      } else {
        onScreenRow = new Array(cols).fill(true);
      }
      const offScreenRow = new Array(cols).fill(false);

      const cellVisibilityMask = [];
      const yStart = Math.max(0, Math.floor(-top / this.rowHeight) - bufferRows);
      const yEnd = Math.min(rows, Math.ceil((window.innerHeight - top) / this.rowHeight) + bufferRows);
      for (let i = 0; i < yStart; ++i) {
        cellVisibilityMask.push(offScreenRow);
      }
      for (let i = 0; i < yEnd - yStart; ++i) {
        cellVisibilityMask.push(onScreenRow);
      }
      for (let i = 0; i < rows - yEnd; ++i) {
        cellVisibilityMask.push(offScreenRow);
      }
      this.cellVisibilityMask = cellVisibilityMask;
    }, 300),
  },
  watch: {
    // check the width on adding the first row
    rows(_, oldRows) {
      if (oldRows.length === 0) {
        this.onScrollX();
      }
    },
    // check the width on adding the first row
    isMobile() {
      this.onScrollX();
    },
  },
  mounted() {
    this.onScrollX();
    this.onScrollY();
    document.addEventListener('scroll', this.onScrollY);
  },
  beforeDestroy() {
    document.removeEventListener('scroll', this.onScrollY);
  },
};
</script>

<style scoped>
.mt-wrap {
  position: relative;
}

.mt-vars {
  --mt-shadow-transition: box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  --mt-horizontal-elevation-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.18);
  --mt-heading-elevation-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.18);
}

.mt-cell-wrap {
  flex-grow: 1;
}

.mt-heading .mt-cell-wrap {
  height: 48px;
  line-height: 48px;
}

.mt-heading .mt-cell-wrap.mt-fixed {
  position: relative;
  /* should be above all other cells */
  z-index: 3;
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
  clip-path: inset(0px 0px -5px 0px);
  transition: var(--mt-shadow-transition);
}

.mt-heading.mt-elevation-shadow {
  box-shadow: var(--mt-heading-elevation-shadow);
}

.mt-header-left-spacer {
  flex-grow: 0;
  flex-shrink: 0;
  width: var(--mt-row-actions-width);
  min-width: var(--mt-row-actions-width);
}

.mt-heading,
.mt-body .mt-row {
  background-color: white;
  display: flex;
  flex-wrap: nowrap;
}

.mt-body .mt-row {
  min-width: var(--mt-min-row-width);
}

.mt-body .mt-cell-wrap,
.mt-heading .mt-cell-wrap.mt-fixed {
  clip-path: inset(0px -5px 0px 0px);
  transition: var(--mt-shadow-transition);
}

.mt-body .mt-cell-wrap.mt-elevation-shadow,
.mt-heading .mt-cell-wrap.mt-elevation-shadow {
  box-shadow: var(--mt-horizontal-elevation-shadow);
}

.mt-fix-bottom {
  position: sticky;
  bottom: var(--mt-floating-footer-size);
  /* should be above all input cells */
  z-index: 2;
}

.mt-actions-wrap {
  position: sticky;
  right: 0;
  width: var(--mt-row-actions-width);
  transition: var(--mt-shadow-transition);
  clip-path: inset(0px 0px 0px -5px);
}

.mt-actions-wrap.mt-elevation-shadow {
  box-shadow: var(--mt-horizontal-elevation-shadow);
}

.mt-actions-wrap .mt-actions {
  width: 100%;
  height: 100%;
}

/**
 Make sure the horizontal scrollbar is visible on macOS/webkit.
 Same solution the Vuetify data-table uses
 */
.mt-body::-webkit-scrollbar {
  height: 12px;
}
.mt-body::-webkit-scrollbar-track {
  border-radius: 3px;
  background: #eee;
}
.mt-body::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: #bbb;
}
</style>
