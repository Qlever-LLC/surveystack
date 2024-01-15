<template>
  <a-card class="tiptap-editor">
    <a-card-title class="pa-0">
      <div v-if="editor">
        <a-toolbar color="grey-lighten-3" style="zoom: 0.75" flat dense v-if="!disabled" cssFullWidth class="pa-0">
          <a-toolbar-items class="pa-0 align-center justify-space-between" color="grey-lighten-3">
            <div>
              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('paragraph') }"
                @click="editor.chain().focus().setParagraph().run()"
                :disabled="disabled">
                <a-icon>mdi-format-pilcrow</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('heading', { level: 1 }) }"
                @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">
                <a-icon>mdi-format-header-1</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('heading', { level: 2 }) }"
                @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
                <a-icon>mdi-format-header-2</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('heading', { level: 3 }) }"
                @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
                <a-icon>mdi-format-header-3</a-icon>
              </a-btn>
            </div>

            <div class="ml-2">
              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('blockquote') }"
                @click="editor.chain().focus().toggleBlockquote().run()">
                <a-icon>mdi-format-quote-close</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('bulletList') }"
                @click="editor.chain().focus().toggleBulletList().run()">
                <a-icon>mdi-format-list-bulleted</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('orderedList') }"
                @click="editor.chain().focus().toggleOrderedList().run()">
                <a-icon>mdi-format-list-numbered</a-icon>
              </a-btn>
            </div>

            <div>
              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('bold') }"
                @click="editor.chain().focus().toggleBold().run()">
                <a-icon>mdi-format-bold</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('italic') }"
                @click="editor.chain().focus().toggleItalic().run()">
                <a-icon>mdi-format-italic</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('strike') }"
                @click="editor.chain().focus().toggleStrike().run()">
                <a-icon>mdi-format-strikethrough</a-icon>
              </a-btn>

              <a-btn
                icon
                small
                class="menubar__button"
                :class="{ 'v-btn--active': editor.isActive('underline') }"
                @click="editor.chain().focus().toggleUnderline().run()">
                <a-icon>mdi-format-underline</a-icon>
              </a-btn>
            </div>
          </a-toolbar-items>
        </a-toolbar>
      </div>
    </a-card-title>
    <a-card-text class="pa-0">
      <!-- v-slot="{ commands, isActive, getMarkAttrs, menu }" -->
      <!-- class="menububble" @hide="hideLinkMenu" -->
      <bubble-menu :editor="editor" v-if="editor" :tippy-options="{ duration: 100 }">
        <a-btn @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
          bold
        </a-btn>
        <a-btn @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
          italic
        </a-btn>
        <a-btn @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
          strike
        </a-btn>
        <!-- <div class="menububble" :class="{ 'is-active': editor.isActive('link') }">
          <a-card class="pa-0">
            <a-card-text class="pa-0">
              <form class="menububble__form" v-if="linkMenuIsActive" @submit.prevent="setLinkUrl(linkUrl)">
                <a-text-field
                  class="menububble__input ml-4"
                  dense
                  v-model="linkUrl"
                  placeholder="https://"
                  ref="linkInput"
                  @keydown.esc="hideLinkMenu" />
                <a-btn small class="menububble__button" @click="setLinkUrl(linkUrl)" icon>
                  <a-icon>mdi-check</a-icon>
                </a-btn>
                <a-btn small class="menububble__button mr-1" @click="setLinkUrl(null)" icon>
                  <a-icon>mdi-close</a-icon>
                </a-btn>
              </form>

              <template v-else>
                <a-btn
                  class="menububble__button"
                  @click="showLinkMenu(editor.getAttributes('link'))"
                  :class="{ 'is-active': editor.isActive('link') }"
                  icon>
                  <span>{{ editor.isActive('link') ? 'Update Link' : 'Add Link' }}</span>
                  <a-icon>mdi-link</a-icon>
                </a-btn>
              </template>
            </a-card-text>
          </a-card>
        </div> -->
      </bubble-menu>
      <editor-content :editable="!disabled" :editor="editor" class="tiptap-editor" style="width: 100%; height: 100%" />
    </a-card-text>
  </a-card>
</template>

<script>
import { Editor, EditorContent, BubbleMenu } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

// import CustomLink from '@/utils/TipTapCustomLink';
import Link from '@tiptap/extension-link';

export default {
  components: {
    EditorContent,
    BubbleMenu,
  },
  props: {
    modelValue: {
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
        StarterKit,
        Underline,
        // CustomLink,
        Link.configure({ openOnClick: true }),
      ],
      content: 'I amm running Tiptap with Vue.js',
      // content: this.modelValue,
      onUpdate: ({ editor }) => {
        this.emitAfterOnUpdate = true;
        this.$emit('update:modelValue', editor.getHTML());
      },
    });
  },
  beforeUnmount() {
    this.editor.destroy();
  },
  data() {
    return {
      editor: null,
      emitAfterOnUpdate: false,
      linkUrl: null,
      linkMenuIsActive: false,
    };
  },
  watch: {
    modelValue(val) {
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
    setLinkUrl(url) {
      // command.setLink({ href: url });
      this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      this.hideLinkMenu();
    },
  },
};
</script>

<style scoped lang="scss">
.tiptap-editor :deep(.ProseMirror) {
  /* background-color: blue; */
  width: 100%;
  height: 100%;
  min-height: 120px;
  padding: 16px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}

.tiptap-editor :deep(.ProseMirror) blockquote {
  border-left: 0.25em solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin: 20px 0;
}

.tiptap-editor :deep(.ProseMirror) ul,
.tiptap-editor :deep(.ProseMirror) ol {
  padding-left: 24px;
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
  transition:
    opacity 0.2s,
    visibility 0.2s;
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
