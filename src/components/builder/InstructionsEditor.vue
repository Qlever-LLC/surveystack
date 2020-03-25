<template>
  <v-card outlined class="instructions-editor">
    <v-card-title class="pa-0">
      <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
          <v-toolbar color="grey lighten-3" flat dense class="pa-0">
            <v-toolbar-items class="pa-0" color="grey lighten-3">
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

              <!-- <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.code() }"
                @click="commands.code"
              >
                <v-icon>mdi-code-tags</v-icon>
              </v-btn> -->

              <v-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': isActive.paragraph() }"
                @click="commands.paragraph"
              >
                <!-- <v-icon>mdi-format-paragraph</v-icon> -->
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
                :class="{ 'v-btn--active': isActive.code_block() }"
                @click="commands.code_block"
              >
                <v-icon>mdi-code-braces</v-icon>
              </v-btn> -->

              <v-btn
                icon
                small
                class="menubar__button"
                @click="commands.horizontal_rule"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>

            </v-toolbar-items>
          </v-toolbar>
<!--
          <v-toolbar dense class="pa-0">
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
          </v-toolbar> -->
      </editor-menu-bar>
    </v-card-title>
    <v-card-text class="pt-4">
      <editor-content
        :editor="editor"
        class="tiptap-editor"
        style="width: 100%; height: 100%;"
      />
      <!-- <v-row>
        <v-col cols="12">
        </v-col>
      </v-row> -->
    </v-card-text>

      <!-- <tiptap-vuetify
        v-model="content"
        :extensions="extensions"
      /> -->
  </v-card>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar } from 'tiptap';
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
  Link,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Strike,
  Underline,
  History,
} from 'tiptap-extensions';
// import {
//   TiptapVuetify,
//   Heading,
//   Bold,
//   Italic,
//   Strike,
//   Underline,
//   Code,
//   Paragraph,
//   BulletList,
//   OrderedList,
//   ListItem,
//   Link,
//   Blockquote,
//   HardBreak,
//   HorizontalRule,
//   History,
// } from 'tiptap-vuetify';

export default {
  components: {
    // TiptapVuetify,
    EditorContent,
    EditorMenuBar,
  },
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  mounted() {
    // this.editor = new Editor({
    //   content: '<p>this is just a boring paragraph</p>',
    // });
    this.editor = new Editor({
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
        new Link(),
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
};
</script>

<style scoped>
/* .instructions-editor >>> .ProseMirror {
  background-color: red;
} */

.tiptap-editor >>> .ProseMirror {
  /* background-color: blue; */
  width: 100%;
  height: 100%;
  min-height: 150px;
}
</style>
