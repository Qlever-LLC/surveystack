<template>
  <div class="farm-os-planting">
    <div class="d-flex justify-space-between flex-wrap">
      <app-control-label
        :value="control.label"
        :redacted="redacted"
        :required="required"
        :initializable="control.options.initialize && control.options.initialize.enabled"
        :is-modified="meta && !!meta.dateModified"
        @initialize="initialize"
      />
      <v-btn rounded small text color="primary" class="align-self-center mb-3" @click="clearSelection">
        clear selection
      </v-btn>
    </div>
    <app-control-hint :value="control.hint" />

    <v-progress-circular v-if="loading" indeterminate color="secondary" class="my-8"> </v-progress-circular>

    <v-list style="overflow: auto">
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
            <v-list-item-action class="ml-2 mr-2" v-if="!item.value.isField">
              <v-checkbox
                v-if="control.options.hasMultipleSelections"
                :input-value="active"
                :true-value="hashItem(item)"
                color="focus"
              />
              <v-radio-group v-else :value="active">
                <v-radio :value="true" color="focus" />
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
    if (!value.farmName) {
      return 'NOT_ASSIGNED';
    }
    return `FIELD:${value.farmName}.${value.location.id}`;
  }

  return `ASSET:${value.farmName}.${value.id}`;
};

const transform = (assets) => {
  const withoutArea = [];
  const localAssets = [];
  const areas = {};

  assets.forEach((asset) => {
    if (asset.value.location.length === 0) {
      const tmp = Object.assign({}, asset);
      tmp.value.hash = hashItem(asset);
      if (asset.value.url === '') {
        localAssets.push(tmp);
      } else {
        withoutArea.push(tmp);
      }

      return;
    }

    asset.value.location.forEach((location) => {
      areas[`${asset.value.farmName}.${location.id}`] = {
        farmName: asset.value.farmName,
        location,
      };
    });
  });

  const res = Object.keys(areas).flatMap((key) => {
    const area = areas[key];

    const matchedAssets = assets.filter((asset) => {
      if (asset.value.farmName !== area.farmName) {
        return false;
      }

      return asset.value.location.some((loc) => loc.id === area.location.id);
    });

    console.log('loc', area);
    const field = {
      value: {
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

  const withoutAreaSection = {
    value: {
      farmName: null,
      location: null,
      isField: true,
    },
    label: '<span class="blue-chip mr-4 ml-0 chip-no-wrap">Plantings without Area</span>',
  };

  const localAssetSection = {
    value: {
      farmName: null,
      location: null,
      isField: true,
    },
    label: '<span class="green-chip mr-4 ml-0 chip-no-wrap">New Plantings</span>',
  };

  res.push(withoutAreaSection, ...withoutArea);

  if (localAssets.length > 0) {
    res.unshift(localAssetSection, ...localAssets);
  }

  return res;
};

export default {
  mixins: [baseQuestionComponent, farmosBase()],
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
      }
      if (this.value !== null && !this.control.options.hasMultipleSelections) {
        return hashItem({ value: this.value[0] });
      }
      if (this.control.options.hasMultipleSelections && Array.isArray(this.value)) {
        return this.value.map((v) => hashItem({ value: v }));
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
        return this.transformed.find((t) => t.value.hash === h).value;
      });

      const fields = selectedItems.filter((item) => !!item.isField);

      // selected assets
      const assets = selectedItems.filter((item) => !item.isField);

      const assetsToSelect = fields.flatMap((field) =>
        this.transformed
          .filter((item) => !item.value.isField)
          .filter((item) => item.value.farmName === field.farmName)
          .filter((item) => item.value.location.some((loc) => loc.id === field.location.id))
      );

      assetsToSelect.forEach((assetToSelect) => {
        if (
          assets.some((asset) => asset.farmName === assetToSelect.value.farmName && asset.id === assetToSelect.value.id)
        ) {
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
    clearSelection() {
      this.onChange(null);
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
  border: 1px var(--v-focus-base) solid;
  background-color: white;
  color: var(--v-focus-base);
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
