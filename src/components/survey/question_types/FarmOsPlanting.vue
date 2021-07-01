<template>
  <div class="farm-os-planting">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <app-control-hint :value="control.hint" />

    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="my-8"
    >
    </v-progress-circular>

    <v-list style="overflow: auto;">
      <v-list-item-group
        v-if="!loading"
        :disabled="loading"
        :value="listSelection"
        @change="localChange"
        :multiple="!!control.options.hasMultipleSelections"
      >
        <v-list-item
          v-for="(item, idx) in transformed"
          :value="hashItem(item)"
          :key="`item_${idx}`"
          :disabled="!control.options.hasMultipleSelections && item.value.isField"
        >
          <template v-slot:default="{ active }">
            <v-list-item-action
              class="ml-2 mr-2"
              v-if="!item.value.isField"
            >
              <v-checkbox
                v-if="control.options.hasMultipleSelections "
                :input-value="active"
                :true-value="hashItem(item)"
              />
              <v-radio-group
                v-else
                :value="active"
              >
                <v-radio :value="true" />
              </v-radio-group>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-html="item.label" />
            </v-list-item-content>
          </template>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';

const hashItem = (listItem) => {
  if (listItem === null || listItem.value === null) {
    return '';
  }

  const { value } = listItem;
  if (value.isField) {
    if (!value.farmId) {
      return 'NOT_ASSIGNED';
    }
    return `FIELD:${value.farmId}.${value.location.id}`;
  }

  return `ASSET:${value.farmId}.${value.assetId}`;
};

const transform = (assets) => {
  const withoutArea = [];
  const areas = {};

  assets.forEach((asset) => {
    if (asset.value.location.length === 0) {
      const tmp = Object.assign({}, asset);
      tmp.value.hash = hashItem(asset);
      withoutArea.push(tmp);
      return;
    }


    asset.value.location.forEach((location) => {
      areas[`${asset.value.farmId}.${location.id}`] = {
        farmId: asset.value.farmId,
        farmName: asset.value.farmName,
        location,
      };
    });
  });

  const res = Object.keys(areas).flatMap((key) => {
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

  /* const unassigned = {};
  withoutArea.forEach((item) => {
    if (!unassigned[item.farmId]) {
      unassigned[item.farmId] = {
        label: `<span class="blue-chip mr-4 ml-0 chip-no-wrap">${item.farmName}: Assets without field</span>`,
        value: {
          farmId: item.farmId,
          farmName: item.farmName,
          location: null,
          isField: true,
          hash: `UNASSIGNED:${item.farmId}`,
        },
        assets: [],
      };
    }

    unassigned[item.farmId].assets.push({
      farmId: item.farmId,
      farmName: item.farmName,
      location: null,
      isField: false,
      hash: `UNASSIGNED:${item.farmId}:${item.assetId}`,

    });
  }); */


  const withoutAreaSection = {
    value: {
      farmId: null,
      farmName: null,
      location: null,
      isField: true,
    },
    label: '<span class="blue-chip mr-4 ml-0 chip-no-wrap">Plantings without Area</span>',
  };

  res.push(withoutAreaSection, ...withoutArea);
  return res;
};

export default {
  mixins: [baseQuestionComponent, farmosBase('assets')],
  data() {
    return {
      transformed: [],
    };
  },
  async created() {
    await this.fetchAssets();
    this.transformed = transform(this.assets);
  },
  computed: {
    listSelection() {
      if (this.value === null && this.control.options.hasMultipleSelections) {
        return [];
      } if (this.value !== null && !this.control.options.hasMultipleSelections) {
        return hashItem({ value: this.value[0] });
      } if (this.control.options.hasMultipleSelections && Array.isArray(this.value)) {
        return this.value.map(v => hashItem({ value: v }));
      }
      return null;
    },
  },
  methods: {
    hashItem,
    localChange(hashesArg) {
      let hashes;
      if (!Array.isArray(hashesArg)) {
        if (hashesArg) {
          hashes = [hashesArg];
        } else {
          this.onChange(null);
          return;
        }
      } else {
        hashes = hashesArg;
      }

      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }
        return (this.transformed.find(t => t.value.hash === h)).value;
      });


      // const [farmId, assetId] = itemId.split('.');

      const fields = selectedItems.filter(item => !!item.isField);

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


      if (!Array.isArray(hashesArg)) {
        this.onChange(assets[0]);
      } else {
        this.onChange(assets);
      }
    },
  },
};
</script>

<style scoped>
.chip-no-wrap {
  white-space: nowrap;
}

.farm-os-planting >>> .v-list-item__title .orange-chip,
.farm-os-planting >>> .v-list-item__title .green-chip,
.farm-os-planting >>> .v-list-item__title .blue-chip {
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

.farm-os-planting >>> .v-list-item__title .green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

.farm-os-planting >>> .v-list-item__title .orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}
</style>
