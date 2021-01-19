<template>
  <v-text-field
    v-if="header.type === 'text'"
    :value="item[header.value].value"
    @input="v => {item[header.value].value = v; onInput()}"
    solo
    hide-details
    autocomplete="off"
    :disabled="disabled"
  />
  <v-text-field
    v-else-if="header.type === 'number'"
    :value="item[header.value].value"
    @input="v => {item[header.value].value = Number(v); onInput()}"
    type="number"
    solo
    hide-details
    :disabled="disabled"
  />
  <v-select
    v-else-if="header.type === 'dropdown'"
    :items="getDropdownItems(header.value)"
    item-text="label"
    item-value="value"
    :value="item[header.value].value"
    @input="v => {item[header.value].value = v; onInput()}"
    hide-details
    solo
    :multiple="header.multiple"
    :disabled="disabled"
  />
  <v-combobox
    v-else-if="(header.type === 'autocomplete') && header.custom"
    :items="getDropdownItems(header.value)"
    item-text="label"
    item-value="value"
    :value="item[header.value].value"
    @input="v => {comboboxSearch = null; item[header.value].value = v; onInput()}"
    :delimiters="[',']"
    :multiple="header.multiple"
    :disabled="disabled"
    :return-object="false"
    :search-input.sync="comboboxSearch"
    single-line
    :chips="header.multiple"
    :deletable-chips="header.multiple"
    solo
    hide-details
    class="custom-ontology"
  >
    <template v-slot:selection="data">
      <v-chip
        v-if="header.multiple"
        v-bind="data.attrs"
        :input-value="data.selected"
        close
        @click="data.select"
        @click:close="removeValue(item, header, data.item)"
      >
        {{ getLabel(header, data.item) }}
      </v-chip>
      <div v-else>
        {{ getLabel(header, data.item) }}
      </div>
    </template>
  </v-combobox>
  <v-autocomplete
    v-else-if="(header.type === 'autocomplete') && !header.custom"
    :items="getDropdownItems(header.value)"
    item-text="label"
    item-value="value"
    :value="item[header.value].value"
    @input="v => {comboboxSearch = null; item[header.value].value = v; onInput()}"
    hide-details
    solo
    :multiple="header.multiple"
    :disabled="disabled"
    :search-input.sync="comboboxSearch"
  />
  <v-autocomplete
    v-else-if="header.type === 'farmos_field'"
    :items="farmos.farms || []"
    :value="item[header.value].value"
    @input="v => {item[header.value].value = v || {}; onInput()}"
    item-text="label"
    item-value="value"
    hide-details
    solo
    :disabled="disabled || loading"
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
  <v-autocomplete
    v-else-if="header.type === 'farmos_planting'"
    :value="item[header.value].value"
    @input="v => {item[header.value].value = localChange(v) || {}; onInput()}"
    :items="farmos.plantings || []"
    item-text="label"
    item-value="value"
    hide-details
    solo
    :disabled="disabled || loading"
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
          :value="item[header.value].value"
          @input="v => {item[header.value].value = v; onInput()}"
          @click="setActivePickerMonth"
          hide-details
          v-bind="attrs"
          v-on="on"
          solo
          autocomplete="off"
          :disabled="disabled"
          readonly
        ></v-text-field>
      </template>
      <v-date-picker
        :value="item[header.value].value"
        @input="v => {item[header.value].value = v; menus[`${index}_${header.value}`] = false; onInput()}"
        no-title
      ></v-date-picker>
    </v-menu>
  </div>

  <div v-else>
    ???
  </div>
</template>

<script>
export default {
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
  },
  data() {
    return {
      menus: {}, // object to hold v-models for v-menu
      comboboxSearch: null,
    };
  },
  methods: {
    onInput() {
      this.$emit('changed');
    },
    removeValue(item, header, value) {
      item[header.value].value = item[header.value].value.filter(v => v !== value);
    },
    getLabel(header, value) {
      const dropdownItems = this.getDropdownItems(header.value);
      const found = dropdownItems.find(i => i.value === value);
      return found ? found.label : value;
    },
    log(v) {
      console.log('LOG:', v);
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
        return (this.farmos.plantings.find(t => t.value.hash === h)).value;
      });


      // const [farmId, assetId] = itemId.split('.');

      const fields = selectedItems.filter(item => !!item.isField);

      // selected assets
      const assets = selectedItems.filter(item => !item.isField);

      const assetsToSelect = fields.flatMap(field => this.farmos.plantings
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
        return assets[0];
      }

      return assets;
    },
  },
};
</script>
