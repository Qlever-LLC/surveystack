<template>
  <div class="alert alert-info">
    <button
      type="button"
      class="close"
      data-dismiss="alert"
      aria-label="Close"
      @click="$emit('closed')"
    >
      <span aria-hidden="true">&times;</span>
    </button>
    <h5>Username info</h5>
    <p>Pick any unique username you like. Note however, that it can not be changed later. Your username...</p>
    <ul>
      <li v-for="(r, i) in rules" :key="i">{{r}}</li>
    </ul>
    <div class="d-flex justify-content-end" v-if="!showMore">
      <small>
        <a href="/more" class="text-info" @click.prevent="showMore = true">more...</a>
      </small>
    </div>
    <div v-if="showMore">
      Internally, the following regular expression is used for determinig whether a username is valid:
      <code
        class="d-block p-2"
      >{{code}}</code>Want to learn more about regular expressions? Here is a great website for
      <a
        href="https://regex101.com/"
        target="_blank"
        class="text-info"
      >testing and playing around</a>.
    </div>
  </div>
</template>

<script>
const rules = [
  'must start with a letter',
  'may contain letters, numbers, underscores and dashes',
  'and have a length between 3 and 30 characters.',
];

const code = 'const regex = /^[a-z][a-z0-9-_]{2,29}$/g;';

export default {
  data() {
    return {
      rules,
      code,
      showMore: false,
    };
  },
};
</script>
