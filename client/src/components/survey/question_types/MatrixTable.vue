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
    <div ref="body" class="mt-body" v-scroll.self="onScrollX" :style="{ overflowX: 'auto', overflowY: 'hidden' }">
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
      <v-btn @click="$emit('addRow')" color="primary" :style="{ pointerEvents: 'auto' }">
        <v-icon left>mdi-plus</v-icon>{{ addRowLabel }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import { sum, debounce } from 'lodash';

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
    // skip rendering the cells that aren't visible on the screen
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
      return this.colMinWidths.map((minWidth, colIdx) => ({
        minWidth: `${minWidth}px`,
        flexBasis: `${minWidth}px`,
      }));
    },
    leftFixStyles() {
      return this.cellWidthStyles.map((style, colIdx) => {
        style = { ...style };
        if (this.fixColMask[colIdx]) {
          style.position = 'sticky';
          style.left = `${sum(this.colMinWidths.slice(0, colIdx))}px`;
          /* should be above non-fixed input cells */
          style.zIndex = 1;
        }
        return style;
      });
    },
    minRowWidth() {
      return sum(this.colMinWidths) + (this.isMobile ? 0 : this.rowActionsWidth);
    },
    fixColsWidth() {
      return sum(this.colMinWidths.slice(0, this.fixedColumns));
    },
    fixColMask() {
      return this.headers.map((_, colIdx) => !this.isMobile && this.fixedColumns > colIdx);
    },
    cssVariables() {
      return {
        '--mt-row-actions-width': `${this.rowActionsWidth}px`,
        '--mt-row-height': `${this.rowHeight}px`,
        '--mt-min-row-width': `${this.minRowWidth}px`,
      };
    },
  },
  methods: {
    onScrollX() {
      if (!this.rafIdScrollX) {
        this.rafIdScrollX = window.requestAnimationFrame(() => {
          const body = this.$refs.body;

          this.isLeftFloating = !this.isMobile && body.scrollLeft > 0;
          const scrollLeftMax = body.scrollWidth - body.clientWidth;
          this.isRightFloating = !this.isMobile && scrollLeftMax > body.scrollLeft;

          this.$refs.headerCells.forEach((el, colIdx) => {
            if (!this.fixColMask[colIdx]) {
              // TODO use scrollLeft on the whole header?
              el.style.left = `${-body.scrollLeft}px`;
            }
          });
          this.updateCellVisibility();
          this.rafIdScrollX = null;
        });
      }
    },
    onScrollY() {
      if (!this.rafIdScrollY) {
        this.rafIdScrollY = window.requestAnimationFrame(() => {
          const { top } = this.$el.getBoundingClientRect();
          this.isHeaderFloating = top < 0;
          this.updateCellVisibility();
          this.rafIdScrollY = null;
        });
      }
    },
    shouldRenderCell(rowIdx, colIdx) {
      return (
        !this.dontRenderOffScreenCells || !this.cellVisibilityMask[rowIdx] || this.cellVisibilityMask[rowIdx][colIdx]
      );
    },
    // create a 2d boolean matrix where true marks the cells visible on the scren
    updateCellVisibility: debounce(function() {
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
  height: var(--mt-row-height);
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
  /* floating footer size of the submission page */
  bottom: 68px;
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
</style>
