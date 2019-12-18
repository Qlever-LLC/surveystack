<template>
  <nav>
    <ul>
      <li>
        <router-link :to="{ name: 'my-surveys' }">
          My Surveys
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'browse-surveys' }">
          Browse
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'collect-survey', params: { id: 'asdf' } }">
          New Survey
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'collect-survey-draft-result', params: { id: 'asdf' } }">
          Draft Survey
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {

};
</script>

<style>

</style>
