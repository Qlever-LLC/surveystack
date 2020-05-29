<template>
  <v-container fluid>
    <p
      v-if="control.title"
      class="mb-2 display-2"
    >{{ control.title }}

    </p>

    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="align-self-center ml-4 mb-8"
    >
    </v-progress-circular>

    <v-list style="overflow: auto;">
      <div class="ml-3">
        <v-label class="ml-3">{{control.label}}</v-label>
      </div>
      <v-list-item-group
        v-if="!loading"
        :disabled="loading"
        :value="listSelection"
        @change="localChange"
        multiple
      >
        <v-list-item
          v-for="(item, idx) in transformed"
          :value="hashItem(item)"
          :key="`item_${idx}`"
        >
          <template v-slot:default="{ active, toggle }">
            <v-list-item-action class="mr-2">
              <v-checkbox
                :class="{ 'ml-4' : !item.value.isField}"
                :input-value="active"
                :true-value="hashItem(item)"
                @click="toggle"
              />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-html="item.label" />
            </v-list-item-content>
          </template>
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <v-row v-if="false">

      <!-- v-model="values" -->
      <v-autocomplete
        :disabled="loading"
        :value="value"
        @change="localChange"
        :items="transformed || []"
        item-text="label"
        item-value="value"
        outlined
        :chips="false"
        :label="control.label"
        :multiple="true"
        @keyup.enter.prevent="submit"
      >
        <template v-slot:item="{item}">
          <div v-html="item.label"></div>
        </template>
        <template v-slot:selection="{item}">
          <div
            v-html="item.label"
            class="d-flex align-center"
          ></div>
        </template>
      </v-autocomplete>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="align-self-center ml-4 mb-8"
      >
      </v-progress-circular>
    </v-row>
    <p
      v-if="control.hint"
      class="mt-2"
    >{{ control.hint }}</p>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';

const hashItem = (listItem) => {
  const { value } = listItem;
  if (value.isField) {
    return `FIELD:${value.farmId}.${value.location.id}`;
  }

  return `ASSET:${value.farmId}.${value.assetId}`;
};

const transform = (assets) => {
  const areas = {};
  assets.forEach((asset) => {
    asset.value.location.forEach((location) => {
      areas[`${asset.value.farmId}.${location.id}`] = {
        farmId: asset.value.farmId,
        farmName: asset.value.farmName,
        location,
      };
    });
  });

  return Object.keys(areas).flatMap((key) => {
    const area = areas[key];

    const matchedAssets = assets.filter((asset) => {
      if (asset.value.farmId !== area.farmId) {
        return false;
      }

      return asset.value.location.some(loc => loc.id === area.location.id);
    });


    const field = {
      value: {
        farmId: area.farmId,
        farmName: area.farmName,
        location: area.location,
        isField: true,
      },
      label: `<span class="blue-chip mr-4 ml-0 chip-no-wrap">${area.farmName}: ${area.location.name}</span>`,
    };

    field.value.hash = hashItem(field);

    const assetItems = matchedAssets.map((asset) => {
      const r = {
        value: asset.value,
        label: `${asset.value.name} `,
      };

      r.value.hash = hashItem(r);
      return r;
    });

    return [field, ...assetItems];
  });
};

export default {
  mixins: [baseQuestionComponent, farmosBase('assets')],
  data() {
    return {
      transformed: [],
    };
  },
  async created() {
    if (this.value === null) {
      this.onChange([]);
    }
    await this.fetchAssets();
    this.transformed = transform(this.assets);
  },
  computed: {
    listSelection() {
      return this.value.map(v => hashItem({ value: v }));
    },
  },
  methods: {
    hashItem,
    localChange(hashes) {
      console.log('localchange', hashes);
      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }
        return (this.transformed.find(t => t.value.hash === h)).value;
      });


      // console.log('selectedItems', itemId);
      // const [farmId, assetId] = itemId.split('.');


      const fields = selectedItems.filter(item => item.isField === true);

      // selected assets
      const assets = selectedItems.filter(item => !item.isField);

      const assetsToSelect = fields.flatMap(field => this.transformed
        .filter(item => !item.value.isField)
        .filter(item => item.value.farmId === field.farmId)
        .filter(item => item.value.location.some(loc => loc.id === field.location.id)));


      assetsToSelect.forEach((assetToSelect) => {
        if (assets.some(asset => asset.farmId === assetToSelect.value.farmId
          && asset.assetId === assetToSelect.value.assetId)) {
          // skip
        } else {
          assets.push(assetToSelect.value);
        }
      });


      console.log('newValue', assets);


      this.onChange(assets);
    },
  },
};
</script>

<style>
.chip-no-wrap {
  white-space: nowrap;
}

.orange-chip,
.green-chip,
.blue-chip {
  display: inline-flex;
  border: 1px #466cb3 solid;
  background-color: white;
  color: #466cb3;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  vertical-align: middle;
}

.green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

.orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}
</style>
