<template>
  <table class="backGroundGrey colorWhite">
    <thead>
      <tr>
        <th v-for="(head, id) in headers" :key="id" class="text-left colorWhite">
          {{ head.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, id) in items" :key="id">
        <td class="box">
          <div class="d-flex justify-space-between align-center">
            <div>{{ item.url }}</div>
            <div>
              <my-button little noBorder colorBlue label="access" />
              <my-button little noBorder colorWhite label="move" />
              <my-button little noBorder colorRed label="remove" />
            </div>
          </div>
        </td>
        <td v-if="Array.isArray(item.grpAccess) && item.grpAccess.length" class="box">
          <a-chip
            v-for="(group, id) in item.grpAccess"
            :key="id"
            class="ma-2"
            color="white"
            close
            @click:close="onCloseGrpAccess(item, group.id)"
            label
          >
            {{ group.value }}
          </a-chip>
        </td>
        <td v-else class="box">
          <p>
            <i>only owners may view this information</i>
          </p>
        </td>
        <td v-if="Object.entries(item.othAccess) && Object.entries(item.othAccess).length" class="box">
          <a-chip
            v-for="(other, id) in item.othAccess"
            :key="id"
            class="ma-2"
            color="white"
            close
            @click:close="onCloseOthAccess(item, other.id)"
            label
          >
            {{ other.value }}
          </a-chip>
        </td>
        <td v-else class="box">
          <p>
            <i>only owners may view this information</i>
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import {} from '@vue/composition-api';
import MyButton from './common/Button.vue';
import AChip from '@/components/ui/AChip.vue';

export default {
  components: { MyButton, AChip },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  emits: ['onCloseGrpAccess', 'onCloseOthAccess'],
  setup(props, context) {
    function onCloseGrpAccess(item, id) {
      context.emit('onCloseGrpAccess', item, id);
    }
    function onCloseOthAccess(item, id) {
      context.emit('onCloseOthAccess', item, id);
    }

    return {
      onCloseGrpAccess,
      onCloseOthAccess,
    };
  },
};
</script>

<style scoped>
.backGroundGrey {
  background-color: rgb(143, 142, 142) !important;
}
.backGroundWhiteFontBlack {
  background-color: white !important;
  color: black !important;
}
.colorWhite {
  color: white !important;
}

table {
  width: 100%;
  border-spacing: 4px !important;
}
.box {
  align-items: center;
  padding: 16px 4px;
  background-color: rgb(75, 72, 72);
}
td > p {
  margin: 0px;
}
.widthFitContent {
  width: fit-content;
}
</style>
