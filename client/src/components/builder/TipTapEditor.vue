<template>
  <v-card outlined class="tiptap-editor">
    <v-card-title class="pa-0">
      <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
        <a-toolbar color="grey lighten-3" style="zoom: 0.75" flat dense v-if="!disabled" cssFullWidth class="pa-0">
          <v-toolbar-items class="pa-0 align-center justify-space-between" color="grey lighten-3">
            <div>
              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.paragraph() }"
                @click="commands.paragraph"
                :disabled="disabled"
              >
                <v-icon>mdi-format-pilcrow</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.heading({ level: 1 }) }"
                @click="commands.heading({ level: 1 })"
              >
                <v-icon>mdi-format-header-1</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.heading({ level: 2 }) }"
                @click="commands.heading({ level: 2 })"
              >
                <v-icon>mdi-format-header-2</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.heading({ level: 3 }) }"
                @click="commands.heading({ level: 3 })"
              >
                <v-icon>mdi-format-header-3</v-icon>
              </v-btn>
            </div>

            <div class="ml-2">
              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.blockquote() }"
                @click="commands.blockquote"
              >
                <v-icon>mdi-format-quote-close</v-icon>
              </v-btn>

              <!-- <v-btn
                  icon
                  small
                  class="menubar__button"
                  :class="{ 'v-btn--active': isActive.code() }"
                  @click="commands.code"
                >
                  <v-icon>mdi-code-tags</v-icon>
                </v-btn> -->

              <!-- <v-select
                  :items="getParagraphStyles(isActive, commands)"
                >
                  <template v-slot:selection="{ item, index }">
                    <v-btn
                      icon
                      small
                      class="menubar__button"
                      :class="{ 'v-btn--active': condition }"
                      @click="item.action"
                    >
                      <v-icon>{{ item.icon }}</v-icon>
                    </v-btn>
                  </template>

                </v-select> -->

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.bullet_list() }"
                @click="commands.bullet_list"
              >
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.ordered_list() }"
                @click="commands.ordered_list"
              >
                <v-icon>mdi-format-list-numbered</v-icon>
              </v-btn>
            </div>

            <!-- <v-btn
                icon
                small
                class="menubar__button"
                @click="commands.undo"
              >
                <v-icon>mdi-undo</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                @click="commands.redo"
              >
                <v-icon>mdi-redo</v-icon>
              </v-btn> -->

            <div>
              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.bold() }"
                @click="commands.bold"
              >
                <v-icon>mdi-format-bold</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.italic() }"
                @click="commands.italic"
              >
                <v-icon>mdi-format-italic</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.strike() }"
                @click="commands.strike"
              >
                <v-icon>mdi-format-strikethrough</v-icon>
              </v-btn>

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.underline() }"
                @click="commands.underline"
              >
                <v-icon>mdi-format-underline</v-icon>
              </v-btn>
            </div>

            <!-- <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.code_block() }"
                @click="commands.code_block"
              >
                <v-icon>mdi-code-braces</v-icon>
              </v-btn> -->

            <!-- <v-btn
                icon
                small
                class="menubar__button"
                @click="commands.horizontal_rule"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn> -->
          </v-toolbar-items>
        </a-toolbar>
        <!--
          <a-toolbar dense class="pa-0">
            <v-toolbar-items class="pa-0">


              <v-btn
                icon
                small
                class="menubar__button"
                @click="commands.createTable({rowsCount: 3, colsCount: 3, withHeaderRow: false })"
              >
                <v-icon>mdi-table</v-icon>
              </v-btn>

              <span v-if="isActive.table()">
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.deleteTable"
                >
                  <v-icon>mdi-delete_table</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.addColumnBefore"
                >
                  <v-icon>mdi-add_col_before</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.addColumnAfter"
                >
                  <v-icon>mdi-add_col_after</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.deleteColumn"
                >
                  <v-icon>mdi-delete_col</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.addRowBefore"
                >
                  <v-icon>mdi-add_row_before</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.addRowAfter"
                >
                  <v-icon>mdi-add_row_after</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.deleteRow"
                >
                  <v-icon>mdi-delete_row</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="menubar__button"
                  @click="commands.toggleCellMerge"
                >
                  <v-icon>mdi-combine_cells</v-icon>
                </v-btn>
              </span>
            </v-toolbar-items>
          </a-toolbar> -->
      </editor-menu-bar>
    </v-card-title>
    <v-card-text class="pa-0">
      <editor-menu-bubble
        class="menububble"
        :editor="editor"
        @hide="hideLinkMenu"
        v-slot="{ commands, isActive, getMarkAttrs, menu }"
      >
        <div
          class="menububble"
          :class="{ 'is-active': menu.isActive }"
          :style="`left: ${menu.left}px; bottom: ${menu.bottom}px;`"
        >
          <v-card class="pa-0">
            <v-card-text class="pa-0">
              <form
                class="menububble__form"
                v-if="linkMenuIsActive"
                @submit.prevent="setLinkUrl(commands.link, linkUrl)"
              >
                <v-text-field
                  class="menububble__input ml-4"
                  dense
                  v-model="linkUrl"
                  placeholder="https://"
                  ref="linkInput"
                  @keydown.esc="hideLinkMenu"
                />
                <v-btn small class="menububble__button" @click="setLinkUrl(commands.link, linkUrl)" icon>
                  <v-icon>mdi-check</v-icon>
                </v-btn>
                <v-btn small class="menububble__button mr-1" @click="setLinkUrl(commands.link, null)" icon>
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </form>

              <template v-else>
                <v-btn
                  class="menububble__button"
                  @click="showLinkMenu(getMarkAttrs('link'))"
                  :class="{ 'is-active': isActive.link() }"
                  icon
                >
                  <span>{{ isActive.link() ? 'Update Link' : 'Add Link' }}</span>
                  <v-icon>mdi-link</v-icon>
                </v-btn>
              </template>
            </v-card-text>
          </v-card>
        </div>
      </editor-menu-bubble>
      <editor-content :disabled="!disabled" :editor="editor" class="tiptap-editor" style="width: 100%; height: 100%" />
    </v-card-text>
  </v-card>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar, EditorMenuBubble } from 'tiptap';
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Strike,
  Underline,
  History,
} from 'tiptap-extensions';

import CustomLink from '@/utils/TipTapCustomLink';
import AToolbar from '@/components/ui/AToolbar.vue';

export default {
  components: {
    EditorContent,
    EditorMenuBar,
    EditorMenuBubble,
    AToolbar,
  },
  props: {
    value: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
    },
  },
  mounted() {
    this.editor = new Editor({
      editable: !this.disabled,
      extensions: [
        new Blockquote(),
        new BulletList(),
        new CodeBlock(),
        new HardBreak(),
        new Heading({ levels: [1, 2, 3] }),
        new HorizontalRule(),
        new ListItem(),
        new OrderedList(),
        new TodoItem(),
        new TodoList(),
        new CustomLink(),
        new Bold(),
        new Code(),
        new Italic(),
        new Strike(),
        new Underline(),
        new History(),
        new Table({
          resizable: true,
        }),
        new TableHeader(),
        new TableCell(),
        new TableRow(),
      ],
      content: this.value,
      onUpdate: ({ getHTML }) => {
        this.emitAfterOnUpdate = true;
        this.$emit('input', getHTML());
      },
    });
  },
  beforeDestroy() {
    this.editor.destroy();
  },
  data() {
    return {
      editor: null,
      emitAfterOnUpdate: false,
      linkUrl: null,
      linkMenuIsActive: false,
      // getParagraphStyles(isActive, commands) {
      //   return [
      //     {
      //       condition: isActive.paragraph(),
      //       action: commands.paragraph,
      //       icon: 'mdi-format-pilcrow',
      //     },
      //     {
      //       condition: isActive.heading({ level: 1 }),
      //       action: commands.heading({ level: 1 }),
      //       icon: 'mdi-format-header-1',
      //     },
      //     {
      //       condition: isActive.heading({ level: 2 }),
      //       action: commands.heading({ level: 2 }),
      //       icon: 'mdi-format-header-2',
      //     },
      //     {
      //       condition: isActive.heading({ level: 3 }),
      //       action: commands.heading({ level: 3 }),
      //       icon: 'mdi-format-header-3',
      //     },
      //   ];
      // },
    };
  },
  watch: {
    value(val) {
      if (this.emitAfterOnUpdate) {
        this.emitAfterOnUpdate = false;
        return;
      }
      if (this.editor) {
        this.editor.setContent(val);
      }
    },
  },
  methods: {
    showLinkMenu(attrs) {
      this.linkUrl = attrs.href;
      this.linkMenuIsActive = true;
      this.$nextTick(() => {
        this.$refs.linkInput.focus();
      });
    },
    hideLinkMenu() {
      this.linkUrl = null;
      this.linkMenuIsActive = false;
    },
    setLinkUrl(command, url) {
      command({ href: url });
      this.hideLinkMenu();
    },
  },
};
</script>

<style scoped>
.tiptap-editor >>> .ProseMirror {
  /* background-color: blue; */
  width: 100%;
  height: 100%;
  min-height: 120px;
  padding: 16px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}

.content {
  border-color: red !important;
}

.tiptap-editor >>> .ProseMirror blockquote {
  border-left: 0.25em solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 20px 0;
}

:root {
  --color-black: #666;
  --color-white: #eee;
}

.menububble {
  position: absolute;
  display: flex;
  z-index: 20;
  background: var(--color-black);
  border-radius: 5px;
  padding: 0.3rem;
  margin-bottom: 0.5rem;
  transform: translateX(-50%);
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
}
.menububble.is-active {
  opacity: 1;
  visibility: visible;
}

.menububble__button {
  display: inline-flex;
  background: transparent;
  border: 0;
  color: var(--color-white);
  padding: 0.2rem 0.5rem;
  margin-right: 0.2rem;
  border-radius: 3px;
  cursor: pointer;
}
.menububble__button:last-child {
  margin-right: 0;
}

.menububble__button:hover {
  background-color: rgba(var(--color-white, 0.1));
}

.menububble__button.is-active {
  background-color: rgba(var(--color-white, 0.2));
}

.menububble__form {
  display: flex;
  align-items: center;
}

.menububble__input {
  font: inherit;
  border: none;
  background: transparent;
  color: var(--color-white);
}
</style>
