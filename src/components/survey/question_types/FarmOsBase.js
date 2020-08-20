import api from '@/services/api.service';

const base = type => ({
  data() {
    return {
      loading: true,
      farms: [],
      assets: [],
    };
  },
  methods: {
    onChange(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
    info(data) {
      console.log('info------', data);
    },
    remove(item) {
      this.changed(
        this.value.filter(v => v !== item.value),
      );
    },
    removeValue(value) {
      this.changed(
        this.value.filter(v => v !== value),
      );
    },
    getLabelForItemValue(value) {
      const item = this.farms.find(x => x.value === value);
      return (item && item.label) || value;
    },
    getLabelForItemValue2(value) {
      console.log(value);
      const item = this.farms.find(x => x.value === value);
      return (item && item.label) || value;
    },
    async fetchAreas() {
      try {
        const response = await api.get('farmos/fields');
        console.log('fields', response);
        this.farms = response.data.flatMap((f) => {
          // '9' => { actualResponse of FarmosInstance}
          const firstKey = Object.keys(f.data)[0];
          const data = f.data[firstKey];
          return data.map(farmField => ({
            label: `<span class="blue-chip mr-4">${f.farm}</span> ${farmField.name} `,
            value: {
              farmName: f.farm.trim(),
              url: f.url,
              name: farmField.name.trim(),
              fieldId: farmField.tid,
            },
          }));
        });
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }
      this.loading = false;
    },
    async fetchAssets() {
      try {
        const response = await api.get('farmos/assets');
        console.log('assets', response);
        this.assets = response.data.flatMap((f) => {
          // '9' => { actualResponse of FarmosInstance}
          const firstKey = Object.keys(f.data)[0];
          const data = f.data[firstKey];
          return data.filter(asset => asset.type === 'planting' && asset.archived === '0').map(planting => ({
            label: `<span class="blue-chip mr-4">${f.farm}</span> ${planting.name} `,
            value: {
              farmName: f.farm.trim(),
              url: f.url,
              name: planting.name.trim(),
              assetId: planting.id,
              location: planting.location,
              farmId: firstKey,
              archived: planting.archived !== '0',
            },
          }));
        });
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }
      this.loading = false;
    },
  },
  computed: {
    sourceIsValid() {
      return this.farms
          && Array.isArray(this.farms)
          && this.farms.length > 0
          && this.farms.every(({ label, value }) => label && value);
    },
  },
});

export default base;
