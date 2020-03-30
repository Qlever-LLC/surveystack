<template>
  <v-container>
    <h1>Manuel's Bouncy Castle</h1>
  </v-container>
</template>

<script>
function farmOSPlanting() {

}

function sandbox() {
  const planting = farmOSPlanting('corn', '2019-03-30');
  return [{
    api: 'farmOS',
    type: 'asset',
    body: planting,
  }];
}

export default {

};
</script>
