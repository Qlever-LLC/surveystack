import Ontology from './Ontology.vue';
import { resourceLocations, resourceTypes } from '@/utils/resources';
import { renderWithVuetify } from '../../../../tests/renderWithVuetify';

const resources = [
  {
    id: 'resource-1',
    label: 'Dropdown Items 1',
    location: resourceLocations.EMBEDDED,
    name: 'dropdown_items_1',
    type: resourceTypes.ONTOLOGY_LIST,
    content: [
      {
        value: 'dog',
        label: 'Dog',
        id: '2',
        tags: '',
      },
      {
        value: 'cat',
        label: 'Cat',
        id: '3',
        tags: '',
      },
      {
        value: 'lizard',
        label: 'Lizard',
        id: '4',
        tags: '',
      },
    ],
  },
  {
    label: 'Survey Reference 2',
    name: 'survey_reference_2',
    id: 'resource-2',
    type: resourceTypes.SURVEY_REFERENCE,
    location: resourceLocations.REMOTE,
    content: {
      id: '60afbd3eac16af0001203bba',
      version: 3,
      path: 'data.checkboxes_1',
    },
  },
];

function getMountOpts(opts = {}) {
  const options = {
    allowCustomSelection: opts.allowCustomSelection || false,
    hasMultipleSelections: opts.hasMultipleSelections || false,
    modelValue: opts.modelValue || null,
    source: opts.source || 'resource-1',
  };
  return {
    props: {
      control: {
        hint: '',
        id: '5',
        label: 'Dropdown 1',
        name: 'dropdown_1',
        options: {
          allowCustomSelection: options.allowCustomSelection,
          hasMultipleSelections: options.hasMultipleSelections,
          source: options.source,
          type: 'ontology',
        },
      },
      resources: [...resources],
      modelValue: options.modelValue,
      index: 'data.dropdown_1',
    },
  };
}

describe('Ontology question', () => {
  describe('Ontology List source', () => {
    it('sets autocomplete input from value in single selection, non-custom mode', () => {
      const { getByText } = renderWithVuetify(Ontology, getMountOpts({ modelValue: ['dog'] }));
      getByText('Dog');
    });

    it('sets autocomplete input from value in single selection, custom mode', () => {
      const { getByText } = renderWithVuetify(
        Ontology,
        getMountOpts({
          modelValue: ['custom'],
          allowCustomSelection: true,
        })
      );
      getByText('custom');
    });

    it('sets autocomplete value from value in multiple selection, non-custom mode', () => {
      const { getByText } = renderWithVuetify(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          modelValue: ['cat', 'dog'],
        })
      );
      getByText('Dog');
      getByText('Cat');
    });

    it('sets autocomplete value from value in multiple selection, custom mode', () => {
      const { getByText } = renderWithVuetify(
        Ontology,
        getMountOpts({
          hasMultipleSelections: true,
          allowCustomSelection: true,
          modelValue: ['custom', 'dog'],
        })
      );
      getByText('Dog');
      getByText('custom');
    });
  });
});
