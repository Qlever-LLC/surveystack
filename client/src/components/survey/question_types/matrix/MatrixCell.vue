<template>
  <v-text-field
    v-if="header.type === 'text'"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    outlined
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />
  <div v-else-if="header.type === 'qrcode'" style="display: flex">
    <div style="flex: 1">
      <v-text-field
        ref="text-qrcode"
        :value="value"
        @input="
          (v) => {
            value = getValueOrNull(v);
            onInput();
          }
        "
        outlined
        hide-details
        autocomplete="off"
        :disabled="disabled"
      />
    </div>
    <div style="flex: 0; display: flex; align-items: center;">
      <app-qr-scanner
        class="mx-2 py-2"
        ref="scan-button"
        small
        @codeDetected="
          (v) => {
            // console.log('value is', v);
            value = getValueOrNull(v);
            onInput();
          }
        "
      />
    </div>
  </div>

  <v-text-field
    v-else-if="header.type === 'number'"
    :value="value"
    @input="
      (v) => {
        value = handleNumberInput(v);
        onInput();
      }
    "
    type="number"
    outlined
    hide-details
    :disabled="disabled"
  />
  <v-select
    v-else-if="header.type === 'dropdown'"
    :items="items"
    item-text="label"
    item-value="value"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    hide-details
    outlined
    :multiple="header.multiple"
    :disabled="disabled"
  >
    <template v-slot:selection="{ item, index }">
      <span v-if="index === 0" class="mr-1">{{ item.label }}</span>
      <span v-if="index === 1" class="grey--text text-caption others">
        (+{{ value.length - 1 }} {{ value.length > 2 ? 'others' : 'other' }})
      </span>
    </template>
  </v-select>
  <v-combobox
    v-else-if="header.type === 'autocomplete' && header.custom"
    :items="items"
    item-text="label"
    item-value="value"
    :value="value"
    @input="
      (v) => {
        comboboxSearch = null;
        value = getValueOrNull(v);
        onInput();
      }
    "
    :delimiters="[',']"
    :multiple="header.multiple"
    :disabled="disabled"
    :return-object="false"
    :search-input.sync="comboboxSearch"
    outlined
    class="custom-ontology"
  >
    <template v-slot:selection="{ item, index }">
      <span v-if="index === 0" class="mr-1">{{ getLabel(item) }}</span>
      <span v-if="index === 1" class="grey--text text-caption others">
        (+{{ value.length - 1 }} {{ value.length > 2 ? 'others' : 'other' }})
      </span>
    </template>
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            No values matching "<strong>{{ comboboxSearch }}</strong
            >". Press <kbd>enter</kbd> <span v-if="header.multiple">or <kbd>,</kbd></span> to create a new one
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-combobox>
  <v-autocomplete
    v-else-if="header.type === 'autocomplete' && !header.custom"
    :items="items"
    item-text="label"
    item-value="value"
    :value="value"
    @input="
      (v) => {
        comboboxSearch = null;
        value = getValueOrNull(v);
        onInput();
      }
    "
    hide-details
    outlined
    :multiple="header.multiple"
    :disabled="disabled"
    :search-input.sync="comboboxSearch"
  >
    <template v-slot:selection="{ item, index }">
      <span v-if="index === 0" class="mr-1">{{ item.label }}</span>
      <span v-if="index === 1" class="grey--text text-caption others">
        (+{{ value.length - 1 }} {{ value.length > 2 ? 'others' : 'other' }})
      </span>
    </template>
  </v-autocomplete>
  <v-autocomplete
    v-else-if="header.type === 'farmos_field'"
    :items="farmos.farms || []"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(v);
        onInput();
      }
    "
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    outlined
    :disabled="disabled || loading"
  >
    <template v-slot:item="{ item }">
      <div v-html="item.label"></div>
    </template>
  </v-autocomplete>
  <v-autocomplete
    v-else-if="header.type === 'farmos_planting'"
    :value="value"
    @input="
      (v) => {
        value = getValueOrNull(localChange(v));
        onInput();
      }
    "
    :items="farmos.plantings || []"
    :label="value ? value.farmName : null"
    item-text="value.name"
    item-value="value"
    hide-details
    outlined
    :disabled="disabled || loading"
  >
    <template v-slot:item="{ item }">
      <div v-html="item.label"></div>
    </template>
  </v-autocomplete>
  <div v-else-if="header.type === 'date'">
    <v-menu
      :close-on-content-click="false"
      v-model="menus[`${index}_${header.value}`]"
      transition="scale-transition"
      offset-y
      max-width="290px"
      min-width="290px"
      ref="datepickermenu"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          :value="value"
          @input="
            (v) => {
              value = v;
              onInput();
            }
          "
          @click="setActivePickerMonth"
          hide-details
          v-bind="attrs"
          v-on="on"
          outlined
          autocomplete="off"
          :disabled="disabled"
          readonly
        ></v-text-field>
      </template>
      <v-date-picker
        :value="value"
        @input="
          (v) => {
            value = v;
            menus[`${index}_${header.value}`] = false;
            onInput();
          }
        "
        no-title
      ></v-date-picker>
    </v-menu>
  </div>

  <div v-else>???</div>
</template>

<script>
import { getValueOrNull } from '@/utils/surveyStack';
import appQrScanner from '@/components/ui/QrScanner.vue';

export default {
  components: {
    appQrScanner,
  },
  props: {
    header: {
      type: Object,
    },
    item: {
      type: Object,
    },
    index: {
      type: Number,
    },
    getDropdownItems: {
      type: Function,
    },
    farmos: {
      type: Object,
      default() {
        return { farms: [], plantings: [] };
      },
    },
    disabled: {
      type: Boolean,
    },
    loading: {
      type: Boolean,
    },
  },
  data() {
    return {
      menus: {}, // object to hold v-models for v-menu
      comboboxSearch: null,
    };
  },
  computed: {
    value: {
      get() {
        return this.item[this.header.value].value;
      },
      set(value) {
        this.item[this.header.value].value = value;
      },
    },
    items() {
      return this.getDropdownItems(this.header.value, Array.isArray(this.value) ? this.value : [this.value]);
    },
  },
  methods: {
    getValueOrNull,
    onInput() {
      this.$emit('changed');
    },
    handleNumberInput(v) {
      if (v === '') {
        return null;
      }

      const n = Number(v);

      // eslint-disable-next-line
      if (isNaN(n)) {
        return null;
      }

      return n;
    },
    getLabel(value) {
      const dropdownItems = this.items;
      const found = dropdownItems.find((i) => i.value === value);
      return found ? found.label : value;
    },
    setActivePickerMonth() {
      setTimeout(() => {
        this.$refs.datepickermenu.$children[1].$children[0].activePicker = 'MONTH';
      });
    },
    // copied/adapted from FarmOsPlanting.vue
    localChange(hashesArg) {
      let hashes;
      if (!Array.isArray(hashesArg)) {
        if (hashesArg) {
          hashes = [hashesArg];
        } else {
          return null;
        }
      } else {
        hashes = hashesArg;
      }

      // console.log('hashes', hashes);

      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }
        return this.farmos.plantings.find((t) => t.value.hash === h).value;
      });

      // const [farmId, assetId] = itemId.split('.');

      const fields = selectedItems.filter((item) => !!item.isField);

      // selected assets
      const assets = selectedItems.filter((item) => !item.isField);

      const assetsToSelect = fields.flatMap((field) =>
        this.farmos.plantings
          .filter((item) => !item.value.isField)
          .filter((item) => item.value.farmId === field.farmId)
          .filter((item) => item.value.location.some((loc) => loc.id === field.location.id))
      );

      assetsToSelect.forEach((assetToSelect) => {
        if (
          assets.some(
            (asset) => asset.farmId === assetToSelect.value.farmId && asset.assetId === assetToSelect.value.assetId
          )
        ) {
          // skip
        } else {
          assets.push(assetToSelect.value);
        }
      });

      if (!Array.isArray(hashesArg)) {
        return assets[0];
      }

      return assets;
    },
  },
};
</script>

<style>
.v-select__selections {
  flex-wrap: nowrap;
}
.v-select__selections span {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
