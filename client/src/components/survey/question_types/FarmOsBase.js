import api from '@/services/api.service';
import { getValueOrNull } from '@/utils/surveyStack';
import { linearControls } from '@/utils/submissions';

const base = () => ({
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
      const item = this.farms.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    async fetchFarms() {
      this.loading = true;
      try {
        const farms = await this.$store.dispatch('draft/getFarmOsResource', 'farms');
        this.farms = farms.map(({ instanceName }) => ({
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
        const assets = await this.$store.dispatch('draft/getFarmOsResource', 'assets');

        this.farms = assets.map((f) => ({
          label: `<span class="blue-chip mr-4">${f.instanceName}</span> ${f.name} `,
          value: {
            farmName: f.instanceName,
            url: f.instanceName,
            name: f.name.trim(),
            id: f.id,
          },
        }));
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }

      const submission = this.$store.getters['draft/submission'];
      const survey = this.$store.getters['draft/survey'];
      const nodes = linearControls(survey, submission).filter((node) => node.value);

      const localAreas = [];
      for (const node of nodes) {
        if (node.type === 'farmOsUuid' && node.options.farmOsType === 'field') {
          localAreas.push({
            label: `<span class="green-chip mr-4">New Field</span> ${node.value.name}`,
            value: {
              farmName: '',
              url: '',
              name: node.value.name,
              id: node.value.id,
            },
          });
        } else if (node.type === 'matrix' && node.options && node.options.source && node.options.source.content) {
          const farmosUuidElements = node.options.source.content.filter(
            (c) => c.type == 'farmos_uuid' && c.options.farmOsType === 'field'
          );

          for (const config of farmosUuidElements) {
            const colName = config.value;
            const values = node.value.filter((row) => row[colName].value && row[colName].value.name);
            localAreas.push(
              ...values.map((row) => ({
                label: `<span class="green-chip mr-4">New Field</span> ${row[colName].value.name}`,
                value: {
                  farmName: '',
                  url: '',
                  name: row[colName].value.name,
                  id: row[colName].value.id,
                },
              }))
            );
          }
        }
      }

      this.farms = [...localAreas, ...this.farms];
      this.loading = false;
    },
    async fetchAssets() {
      this.loading = true;

      try {
        const [locationAssets, plantAssets] = await Promise.all([
          this.$store.dispatch('draft/getFarmOsResource', 'assets'),
          this.$store.dispatch('draft/getFarmOsResource', 'plant'),
        ]);

        this.assets = plantAssets.map((asset) => {
          const location = asset.location
            ? asset.location.map(({ id }) => {
                const match = locationAssets.find((l) => l.id === id);

                return {
                  id,
                  name: match ? match.name : '(No Area Associated)',
                };
              })
            : [];

          return {
            label: `<span class="blue-chip mr-4">${asset.instanceName}</span> ${asset.name} `,
            value: {
              farmName: asset.instanceName,
              url: asset.instanceName,
              name: asset.name.trim(),
              id: asset.id,
              archived: asset.archived !== null,
              location,
            },
          };
        });
      } catch (e) {
        console.log('something went wrong:', e);
        // TODO show error
      }

      // submission assets

      const submission = this.$store.getters['draft/submission'];
      const survey = this.$store.getters['draft/survey'];
      const nodes = linearControls(survey, submission).filter((node) => node.value);

      const localPlantings = [];
      for (const node of nodes) {
        if (node.type === 'farmOsUuid' && node.options.farmOsType === 'planting' && node.value.name) {
          localPlantings.push({
            label: `${node.value.name}`,
            value: {
              farmName: '',
              url: '',
              name: node.value.name,
              id: node.value.id,
              archived: false,
              location: [],
            },
          });
        } else if (node.type === 'matrix' && node.options && node.options.source && node.options.source.content) {
          const farmosUuidElements = node.options.source.content.filter(
            (c) => c.type == 'farmos_uuid' && c.options.farmOsType === 'planting'
          );

          for (const config of farmosUuidElements) {
            const colName = config.value;
            const values = node.value.filter((row) => row[colName].value && row[colName].value.name);

            localPlantings.push(
              ...values.map((row) => ({
                label: `${row[colName].value.name}`,
                value: {
                  farmName: '',
                  url: '',
                  name: row[colName].value.name,
                  id: row[colName].value.id,
                  archived: false,
                  location: [],
                },
              }))
            );
          }
        }
      }

      this.assets = [...localPlantings, ...this.assets];
      this.loading = false;
    },
  },
  computed: {
    getArrayValue() {
      return Array.isArray(this.value) ? this.value : this.value ? [this.value] : [];
    },
    getValue() {
      return this.control.options.hasMultipleSelections ? this.getArrayValue : this.getArrayValue[0] || this.value;
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
