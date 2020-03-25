<template>
  <div class="instructions-editor">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <button
          class="menubar__button"
          @click="commands.undo"
        >
          <v-icon>mdi-undo</v-icon>
        </button>

        <button
          class="menubar__button"
          @click="commands.redo"
        >
          <v-icon>mdi-redo</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.bold() }"
          @click="commands.bold"
        >
          <v-icon>mdi-format-bold</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.italic() }"
          @click="commands.italic"
        >
          <v-icon>mdi-format-italic</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.strike() }"
          @click="commands.strike"
        >
          <v-icon>mdi-format-strikethrough</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.underline() }"
          @click="commands.underline"
        >
          <v-icon>mdi-format-underline</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code() }"
          @click="commands.code"
        >
          <v-icon>mdi-code-tags</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.paragraph() }"
          @click="commands.paragraph"
        >
          <!-- <v-icon>mdi-format-paragraph</v-icon> -->
          <v-icon>mdi-format-pilcrow</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >
          <v-icon>mdi-format-header-1</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          <v-icon>mdi-format-header-2</v-icon>

        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >
          <v-icon>mdi-format-header-3</v-icon>

        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.bullet_list() }"
          @click="commands.bullet_list"
        >
          <v-icon>mdi-format-list-bulleted</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <v-icon>mdi-format-list-numbered</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
          <v-icon>mdi-format-quote-close</v-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <!-- <v-icon>mdi-code-tags</v-icon> -->
          <!-- <v-icon>mdi-code-json</v-icon> -->
          <v-icon>mdi-code-braces</v-icon>
        </button>

        <button
          class="menubar__button"
          @click="commands.horizontal_rule"
        >
          <v-icon>mdi-minus</v-icon>
        </button>


        <button
            class="menubar__button"
            @click="commands.createTable({rowsCount: 3, colsCount: 3, withHeaderRow: false })"
          >
            <v-icon>mdi-table</v-icon>
          </button>

          <span v-if="isActive.table()">
            <button
              class="menubar__button"
              @click="commands.deleteTable"
            >
              <v-icon>mdi-delete_table</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.addColumnBefore"
            >
              <v-icon>mdi-add_col_before</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.addColumnAfter"
            >
              <v-icon>mdi-add_col_after</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.deleteColumn"
            >
              <v-icon>mdi-delete_col</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.addRowBefore"
            >
              <v-icon>mdi-add_row_before</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.addRowAfter"
            >
              <v-icon>mdi-add_row_after</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.deleteRow"
            >
              <v-icon>mdi-delete_row</v-icon>
            </button>
            <button
              class="menubar__button"
              @click="commands.toggleCellMerge"
            >
              <v-icon>mdi-combine_cells</v-icon>
            </button>
          </span>
      </div>
    </editor-menu-bar>
    <editor-content :editor="editor" />


    <!-- <tiptap-vuetify
      v-model="content"
      :extensions="extensions"
    /> -->
  </div>
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
      content: `
          <h1>Yay Headlines!</h1>
          <p>All these <strong>cool tags</strong> are working now.</p>
        `,
    });
  },
  beforeDestroy() {
    this.editor.destroy();
  },
  data() {
    return {
      editor: null,
    };
  },
};
</script>

<style>

</style>
