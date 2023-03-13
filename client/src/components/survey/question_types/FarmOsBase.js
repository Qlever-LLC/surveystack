import api from '@/services/api.service';
import { getValueOrNull } from '@/utils/surveyStack';
import { linearControls } from '@/utils/submissions';

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
      // console.log(value);
      const item = this.farms.find((x) => x.value === value);
      return (item && item.label) || value;
    },
    async fetchFarms() {
      this.loading = true;
      try {
        const response = await api.get('farmos/farms');
        this.farms = response.data.map(({ instanceName }) => ({
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
        const response = await api.get('farmos/assets?bundle=land');

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

      const submission = this.$store.getters['draft/submission'];
      const survey = this.$store.getters['draft/survey'];
      const nodes = linearControls(survey, submission);
      const farmOsType = 'field';

      const localAreas = [];
      for (const node of nodes) {
        if (node.type === 'farmOsUuid' && node.options.farmOsType === farmOsType) {
          if (!node.value) {
            continue;
          }
          localAreas.push({
            label: `<span class="green-chip mr-4">New Field</span> ${node.value.name}`,
            value: {
              farmName: '',
              url: '',
              name: node.value.name,
              fieldId: node.value.id,
            },
          });
        }

        if (node.type === 'matrix') {
          if (!node.options || !node.options.source || !node.options.source.content) {
            continue;
          }

          const farmosUuidElemets = node.options.source.content.filter((c) => c.type == 'farmos_uuid');

          for (const config of farmosUuidElemets) {
            // console.log('config', config);
            const type = config.options.farmOsType;
            const colName = config.value;
            if (type === farmOsType && node.value) {
              // console.log('type matches');
              for (const v of node.value) {
                const targetValue = v[colName].value;
                if (targetValue && targetValue.name) {
                  localAreas.push({
                    label: `<span class="green-chip mr-4">New Field</span> ${targetValue.name}`,
                    value: {
                      farmName: '',
                      url: '',
                      name: targetValue.name,
                      fieldId: targetValue.id,
                    },
                  });
                }
              }
            }
          }
        }
      }

      this.farms = [...localAreas, ...this.farms];

      this.loading = false;
    },
    async fetchAssets() {
      this.loading = true;
      try {
        const { data: location } = await api.get('farmos/assets?bundle=land');

        // console.log('locations', location);

        const response = await api.get('farmos/assets?bundle=plant');

        // console.log('res', response.data);
        this.assets = response.data.assets.map((f) => {
          let loc = [];

          if (f.location) {
            loc = f.location.map((loc) => {
              const asset = location.assets.find((l) => l.id === loc.id);

              return {
                id: loc.id,
                name: asset ? asset.name : '(No Area Associated)',
              };
            });
          }

          return {
            label: `<span class="blue-chip mr-4">${f.instanceName}</span> ${f.name} `,
            value: {
              farmId: f.instanceName,
              farmName: f.instanceName,
              url: f.instanceName,
              name: f.name.trim(),
              id: f.id,
              archived: f.archived !== null,
              location: loc,
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
      const nodes = linearControls(survey, submission);

      // console.log('nodes', nodes);

      const farmOsType = 'planting';

      const localPlantings = [];
      for (const node of nodes) {
        if (node.type === 'farmOsUuid' && node.options.farmOsType === farmOsType) {
          if (!node.value || !node.value.name) {
            continue;
          }
          localPlantings.push({
            label: `${node.value.name}`,
            value: {
              farmId: '',
              farmName: '',
              url: '',
              name: node.value.name,
              id: node.value.id,
              archived: false,
              location: [],
            },
          });
        }

        if (node.type === 'matrix') {
          if (!node.options || !node.options.source || !node.options.source.content) {
            continue;
          }

          const farmosUuidElemets = node.options.source.content.filter((c) => c.type == 'farmos_uuid');

          for (const config of farmosUuidElemets) {
            const type = config.options.farmOsType;
            const colName = config.value;
            if (type === farmOsType && node.value) {
              for (const v of node.value) {
                const targetValue = v[colName].value;
                if (targetValue && targetValue.name) {
                  localPlantings.push({
                    label: `${targetValue.name}`,
                    value: {
                      farmId: '',
                      farmName: '',
                      url: '',
                      name: targetValue.name,
                      id: targetValue.id,
                      archived: false,
                      location: [],
                    },
                  });
                }
              }
            }
          }
        }
      }

      // console.log('localplantings', localPlantings);
      this.assets = [...localPlantings, ...this.assets];
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
