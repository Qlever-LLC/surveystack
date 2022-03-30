import api from '@/services/api.service';

import { getValueOrNull } from '@/utils/surveyStack';

const base = (type) => ({
  data() {
    return {
      loading: false,
      farms: [],
      assets: [],
    };
  },
  methods: {
    getValueOrNull,
    onChange(v) {
      if (!v) {
        this.changed(null);
        return;
      }

      const nextValue = Array.isArray(v) ? getValueOrNull(v) : [getValueOrNull(v)];
      this.changed(nextValue);
    },
    remove(item) {
      const isNotItem = (v) => JSON.stringify(v) !== JSON.stringify(item.value);
      this.changed(this.getValueOrNull(this.value.filter(isNotItem)));
    },
    getLabelForItemValue(value) {
      const item = this.farms.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    getLabelForItemValue2(value) {
      console.log(value);
      const item = this.farms.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    async fetchFarms() {
      this.loading = true;
      try {
        const response = await api.get('farmos/farms');
        this.farms = response.data.map(({ name, instanceName }) => ({
          label: instanceName,
          value: {
            url: instanceName,
          },
        }));
      } catch (err) {
        console.error(err);
      }
      this.loading = false;
    },
    async fetchAreas() {
      this.loading = true;
      try {
        const response = await api.get('farmos/fields?bundle=land');

        this.farms = response.data.assets.map((f) => ({
          label: `<span class="blue-chip mr-4">${f.instanceName}</span> ${f.name} `,
          value: {
            farmName: f.instanceName,
            url: f.instanceName,
            name: f.name.trim(),
            fieldId: f.id,
          },
        }));
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }
      this.loading = false;
    },
    async fetchAssets() {
      this.loading = true;
      try {
        const { data: location } = await api.get('farmos/fields?bundle=land');

        const response = await api.get('farmos/fields?bundle=plant');

        console.log('res', response.data);
        this.assets = response.data.assets.map((f) => ({
          label: `<span class="blue-chip mr-4">${f.instanceName}</span> ${f.name} `,
          value: {
            farmId: f.instanceName,
            farmName: f.instanceName,
            url: f.instanceName,
            name: f.name.trim(),
            assetId: f.id,
            archived: f.archived !== null,
            location: f.location.map((loc) => ({
              id: loc.id,
              name: location.assets.find((l) => l.id === loc.id).name,
            })),
          },
        }));
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }
      this.loading = false;
    },
  },
  computed: {
    getValue() {
      return this.control.options.hasMultipleSelections ? this.value : this.value && this.value[0];
    },
    sourceIsValid() {
      return (
        this.farms &&
        Array.isArray(this.farms) &&
        this.farms.length > 0 &&
        this.farms.every(({ label, value }) => label && value)
      );
    },
  },
});

export default base;
