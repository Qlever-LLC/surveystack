<template>
  <div class="mt-wrapper" :style="cssVariables">
    <div ref="header" class="mt-heading mt-divider" :class="{ 'mt-heading-shadow': isHeaderFloating }">
      <div
        class="caption font-weight-bold text--secondary mt-header"
        v-for="(header, colIdx) in headers"
        :key="colIdx"
        :style="thStyles[colIdx]"
      >
        <div ref="headerCells" class="white px-4 d-flex flex-nowrap" :style="{ position: 'relative' }">
          <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
            {{ colIdx }}
          </slot>
        </div>
      </div>
      <div class="mt-header-left-spacer" />
    </div>

    <!-- <table cellspacing="0" :style="{ tableLayout: 'fixed', minWidth: '100%' }">
      <colgroup>
        <col v-for="(width, colIdx) in colMinWidths" :width="`${width}px*`" :key="colIdx" />
      </colgroup>
      <thead>
        <th
          class="caption font-weight-bold text--secondary mt-header text-left"
          v-for="(header, colIdx) in headers"
          :key="colIdx"
          :style="cellWidthStyles[colIdx]"
        >
          <div ref="headerCells" class="white px-4 d-flex flex-nowrap" :style="{ position: 'relative' }">
            <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
              {{ colIdx }}
            </slot>
          </div>
        </th>
        <th class="mt-header-left-spacer" />
      </thead>
    </table> -->
    <!-- <v-virtual-scroll ref="body" v-scroll.self="onScrollX" :items="rowsWithId" height="300" item-height="64"> -->
    <!-- <template v-slot="{ item }"> -->
    <!-- <div v-if="false" ref="body" v-scroll.self="onScrollX" :style="{ overflowX: 'auto', overflowY: 'hidden' }">
      <div v-for="(item, rowIdx) in rows" :key="rowIdx">
        <div class="mt-row" @click="isMobile && $emit('showEditDialog', rowIdx)">
          <div class="mt-cell" v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
            <div ref="fixCells" class="mt-fill d-flex align-center white px-1" :class="leftFixClasses(colIdx)">
              <slot
                v-if="!cellVisibility[rowIdx] || cellVisibility[rowIdx][colIdx]"
                name="row-cell"
                v-bind:header="header"
                v-bind:row="item"
                v-bind:colIdx="colIdx"
              >
                {{ ' / ' + colIdx }}
              </slot>
            </div>
          </div>
          <div
            v-if="$scopedSlots['row-actions']"
            class="mt-row-actions mt-fixed-right ml-1 mt-cell flex-grow-0 flex-shrink-0"
          >
            <div class="mt-fix-right mt-fill d-flex align-center white">
              <slot name="row-actions" v-bind:rowIdx="rowIdx"> </slot>
            </div>
          </div>
        </div>
      </div>
    </div> -->
    <!-- </template> -->
    <!-- </v-virtual-scroll> -->
    <div :style="{ width: '100%', overflow: 'auto' }" v-scroll.self="onScrollX" ref="body">
      <table cellspacing="0" :style="{ tableLayout: 'fixed', minWidth: '100%' }">
        <tbody>
          <tr v-for="(item, rowIdx) in rows" :key="rowIdx">
            <td v-for="(header, colIdx) in headers" class="white" :style="tdStyles[colIdx]" :key="colIdx">
              <slot
                v-if="!cellVisibility[rowIdx] || cellVisibility[rowIdx][colIdx]"
                name="row-cell"
                v-bind:header="header"
                v-bind:row="item"
                v-bind:colIdx="colIdx"
              >
                {{ ' / ' + colIdx }}
              </slot>
            </td>
            <td class="white" :style="actionsStyle">
              <slot name="row-actions" v-bind:rowIdx="rowIdx"> </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-fix-bottom py-4 mb-8" :style="{ pointerEvents: 'none' }">
      <v-btn @click="$emit('addRow')" color="primary" :style="{ pointerEvents: 'auto' }">
        <v-icon left>mdi-plus</v-icon>{{ addRowLabel }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import { sum } from 'lodash';

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
      isLeftFloating: false,
      isRightFloating: false,
      isHeaderFloating: false,
      cellVisibility: [],
    };
  },
  computed: {
    colMinWidths() {
      return this.headers.map(({ scaleWidth = 100, type }) => defaultColumnWidth(type) * (scaleWidth / 100));
    },
    mtElevationLeft() {
      return {
        boxShadow: '0px 0px 2px 2px rgba(0, 0, 0, 0.18)',
        clipPath: 'inset(0px -5px 0px 0px)',
      };
    },
    cellWidthStyles() {
      return this.colMinWidths.map((minWidth, colIdx) => ({
        minWidth: `${minWidth}px`,
        width: `${(minWidth / (this.minRowWidth - this.rowActionsWidth)) * 100}%`,
      }));
    },
    thStyles() {
      return this.colMinWidths.map((minWidth, colIdx) => {
        let style = {
          minWidth: `${minWidth}px`,
          flexBasis: `${minWidth}px`,
          flexGrow: (1 / minWidth) * 1000,
        };

        if (colIdx < this.fixedColumns) {
          style.zIndex = 2;
        }
        if (this.isLeftFloating && colIdx === this.fixedColumns - 1) {
          style = { ...style, ...this.mtElevationLeft };
        }
        return style;
      });
    },
    tdStyles() {
      return this.colMinWidths.map((minWidth, colIdx) => {
        let style = {
          minWidth: `${minWidth}px`,
          flexBasis: `${minWidth}px`,
          height: `${this.rowHeight}px`,
          padding: '0 1px',
        };
        if (colIdx < this.fixedColumns) {
          style.position = 'sticky';
          style.left = `${sum(this.colMinWidths.slice(0, colIdx))}px`;
          /* should be above non-fixed input cells */
          style.zIndex = 1;
        }
        if (this.isLeftFloating && colIdx === this.fixedColumns - 1) {
          style = { ...style, ...this.mtElevationLeft };
        }
        return style;
      });
    },
    actionsStyle() {
      const style = {
        position: 'sticky',
        right: 0,
        width: 'var(--mt-row-actions-width)',
      };
      if (this.isRightFloating) {
        style.boxShadow = '0px 0px 2px 2px rgba(0, 0, 0, 0.18)';
        style.clipPath = 'inset(0px 0px 0px -5px)';
      }
      return style;
    },
    minRowWidth() {
      return this.colMinWidths.reduce((sum, width) => sum + width, 0);
    },
    fixColsWidth() {
      return this.colMinWidths.slice(0, this.fixedColumns).reduce((sum, width) => sum + width, 0);
    },
    headerLeftSpacerStyles() {
      return {
        flexBasis: `${this.rowActionsWidth}px`,
        flexGrow: 0,
        flexShrink: 0,
      };
    },
    cssVariables() {
      const sideElevationShadow = '0px 0px 2px 2px rgba(0, 0, 0, 0.18)';
      const topElevationShadow = '0px 0px 2px 0px rgba(0, 0, 0, 0.18)';
      return {
        '--mt-left-fix-shadow': this.isLeftFloating === 0 ? '' : sideElevationShadow,
        '--mt-right-fix-shadow': this.isRightFloating === 0 ? '' : sideElevationShadow,
        '--mt-top-fix-shadow': this.isHeaderFloating ? topElevationShadow : '',
        '--mt-row-actions-width': `${this.rowActionsWidth}px`,
        '--mt-row-height': `${this.rowHeight}px`,
      };
    },
  },
  methods: {
    onScrollX() {
      if (!this.rafIdScrollX) {
        this.rafIdScrollX = window.requestAnimationFrame(() => {
          const body = this.$refs.body;
          this.isLeftFloating = body.scrollLeft > 0;
          const scrollLeftMax = body.scrollWidth - body.clientWidth;
          this.isRightFloating = scrollLeftMax > body.scrollLeft;
          this.$refs.headerCells.forEach((el, colIdx) => {
            if (colIdx >= this.fixedColumns) {
              // TODO use scrollLeft on the whole header?
              el.style.left = `${-body.scrollLeft}px`;
            }
          });
          this.rafIdScrollX = null;
        });
      }
    },
    onScrollY() {
      if (!this.rafIdScrollY) {
        this.rafIdScrollY = window.requestAnimationFrame(() => {
          const { top } = this.$el.getBoundingClientRect();
          this.isHeaderFloating = top < 0;
          // this.updateCellVisibility();
          this.rafIdScrollY = null;
        });
      }
    },
    // create a 2d boolean matrix where true marks the cells visible on the scren
    updateCellVisibility() {
      const full = this.$el.getBoundingClientRect();
      const cols = this.headers.length;
      const rows = this.rows.length;

      let onScreenRow;
      if (this.minRowWidth > full.width) {
        const xStartPx = this.scrollLeft + this.fixColsWidth;
        const xEndPx = this.scrollLeft + full.width - this.rowActionsWidth;
        onScreenRow = [];
        let xAt = 0;
        this.colMinWidths.forEach((width, colIdx) => {
          const isVisible = xAt + width >= xStartPx && xAt <= xEndPx;
          onScreenRow.push(isVisible || this.isFixColumn(colIdx));
          xAt += width;
        });
      } else {
        onScreenRow = new Array(cols).fill(true);
      }
      const offScreenRow = new Array(cols).fill(false);

      const cellVisibility = [];
      const yStart = Math.max(0, Math.floor(-full.top / this.rowHeight));
      const yEnd = Math.min(rows, Math.ceil((window.innerHeight - full.top) / this.rowHeight));
      for (let i = 0; i < yStart; ++i) {
        cellVisibility.push(offScreenRow);
      }
      for (let i = 0; i < yEnd - yStart; ++i) {
        cellVisibility.push(onScreenRow);
      }
      for (let i = 0; i < rows - yEnd; ++i) {
        cellVisibility.push(offScreenRow);
      }
      this.cellVisibility = cellVisibility;
    },
    isFixColumn(colIdx) {
      return !this.isMobile && this.fixedColumns > colIdx;
    },
    // leftFixClasses(colIdx) {
    //   if (!this.isFixColumn(colIdx)) {
    //     return '';
    //   }
    //   return {
    //     'mt-fix-left': true,
    //     'mt-fix-left-elevation': true,
    //     // 'mt-elevated': this.scrollLeft !== 0,
    //   };
    // },
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
.mt-header-left-spacer {
  flex-grow: 0;
  flex-shrink: 0;
  width: var(--mt-row-actions-width);
  min-width: var(--mt-row-actions-width);
}
.vue-recycle-scroller {
  height: 300px;
  overflow: auto;
}
.mt-wrapper {
  position: relative;
}

.mt-header {
  flex-grow: 1;
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
  background-color: white;
  display: flex;
  flex-wrap: nowrap;
  /* should be above the all the input cells and actions */
  z-index: 2;
  overflow: hidden;
}

.mt-heading-shadow {
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

.mt-fix-right {
  position: relative;
  /* right: var(--mt-scroll-right); */
  clip-path: inset(0px 0px 0px -5px);
}

.mt-fix-left {
  position: relative;
  /* left: var(--mt-scroll-left); */
}

.mt-fix-left-elevation {
  box-shadow: var(--mt-left-fix-shadow);
  clip-path: inset(0px -5px 0px 0px);
  /* should be above non-fixed input cells */
  z-index: 1;
  position: relative;
}

.mt-row-actions {
  flex-basis: var(--mt-row-actions-width);
  flex-grow: 0;
  flex-shrink: 0;
}

.mt-elevated-left {
  boxshadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.18);
  clippath: inset(0px -5px 0px 0px);
}
</style>
