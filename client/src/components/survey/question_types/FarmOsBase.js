import { getValueOrNull } from '@/utils/surveyStack';
import { linearControls } from '@/utils/submissions';

export default {
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
      this.changed(this.getValueOrNull(this.modelValue.filter(isNotItem)));
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

        this.farms = assets
          .map((f) => ({
            label: f.name,
            value: {
              archived: f.archived,
              farmName: f.instanceName,
              url: f.instanceName,
              name: f.name.trim(),
              id: f.id,
            },
          }))
          .filter((a) => a.value.archived == false);
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
            label: `New Field: ${node.value.name}`,
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
                label: `New Field: ${row[colName].value.name}`,
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

        this.assets = plantAssets
          .map((asset) => {
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
              label: `${asset.name} (${asset.instanceName})`,
              value: {
                farmName: asset.instanceName,
                url: asset.instanceName,
                name: asset.name.trim(),
                id: asset.id,
                archived: asset.archived,
                location,
              },
            };
          })
          .filter((a) => a.value.archived == false);
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
    transform(assets) {
      const withoutArea = [];
      const localAssets = [];
      const areas = {};

      assets.forEach((asset) => {
        if (asset.value.location.length === 0) {
          const tmp = Object.assign({}, asset);
          tmp.value.hash = this.hashItem(asset);
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
            name: '',
          },
          label: area.location.name,
        };

        field.value.hash = this.hashItem(field);

        const assetItems = matchedAssets.map((asset) => {
          const r = {
            value: asset.value,
            label: `${asset.value.name} `,
          };

          r.value.hash = this.hashItem(r);
          return r;
        });

        return [field, ...assetItems];
      });

      const withoutAreaSection = {
        value: {
          farmName: null,
          location: null,
          isField: true,
          isNotClickable: true,
          name: '',
        },
        label: 'Plantings without Area',
      };

      const localAssetSection = {
        value: {
          farmName: null,
          location: null,
          isField: true,
          isNotClickable: true,
          name: '',
        },
        label: 'New Plantings',
      };

      if (withoutArea.length > 0) {
        res.push(withoutAreaSection, ...withoutArea);
      }

      if (localAssets.length > 0) {
        res.unshift(localAssetSection, ...localAssets);
      }

      return res;
    },
    hashItem(listItem) {
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
    },
  },
  computed: {
    getArrayValue() {
      return Array.isArray(this.modelValue) ? this.modelValue : this.modelValue ? [this.modelValue] : [];
    },
    getValue() {
      return this.control.options.hasMultipleSelections ? this.getArrayValue : this.getArrayValue[0] || this.modelValue;
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
};
