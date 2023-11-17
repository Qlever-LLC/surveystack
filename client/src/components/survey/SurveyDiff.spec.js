import { render, fireEvent, screen, within } from '@testing-library/vue';
import SurveyDiff from './SurveyDiff.vue';
import vuetify from '@/plugins/vuetify';
import { createControlInstance } from '@/utils/surveyConfig';
import { cloneDeep, pick, uniqueId, shuffle, range } from 'lodash';
import { diffSurveyVersions, changeType } from '@/utils/surveyDiff';

const { CHANGED, UNCHANGED, REMOVED, ADDED } = changeType;

import { createLocalVue } from '@vue/test-utils';
import AChip from '@/components/ui/elements/AChip.vue';

const localVue = createLocalVue();
localVue.component('a-chip', AChip);

const createOptions = (props = {}) => {
  props = {
    controlsLocalRevision: null,
    controlsRemoteRevisionOld: [],
    controlsRemoteRevisionNew: [],
    versionNameRemoteRevisionOld: 'old',
    versionNameRemoteRevisionNew: 'new',
    defaultOpen: true,
    ...props,
  };
  return {
    props,
    vuetify,
    localVue,
  };
};

const createControl = ({ type, ...options }) => ({
  ...createControlInstance({ type }),
  name: `${type}_${uniqueId()}`,
  children: ['page', 'group'].includes(type) ? [] : undefined,
  ...options,
});

describe('render diff cards', () => {
  const hasDiffRow = (card, propName, oldValue, newValue) => {
    const firstCell = within(card).getByText(propName);
    const secondCell = firstCell.nextElementSibling;
    const thirdCell = secondCell.nextElementSibling;
    expect(firstCell).toBeInTheDocument();
    expect(secondCell).toHaveTextContent(oldValue);
    expect(thirdCell).toHaveTextContent(newValue);
  };

  it('shows change', async () => {
    const oldControl = createControl({ type: 'number', name: 'number_1', label: 'old label', id: 'num_1' });
    const newControl = { ...cloneDeep(oldControl), label: 'new label' };

    render(
      SurveyDiff,
      createOptions({ controlsRemoteRevisionOld: [oldControl], controlsRemoteRevisionNew: [newControl] })
    );

    const card = screen.getByTestId(`diff-card-1-changed`);
    expect(within(card).getByText('changed')).toBeInTheDocument();
    expect(within(card).getByText(newControl.label)).toBeInTheDocument();
    expect(within(card).getByText(newControl.name, { exact: false })).toBeInTheDocument();
    await fireEvent.click(card.firstElementChild);
    hasDiffRow(card, 'label', oldControl.label, newControl.label);
  });

  it('shows addition', () => {
    const newControl = createControl({ type: 'number', name: 'number_1', label: 'number label' });
    render(SurveyDiff, createOptions({ controlsRemoteRevisionOld: [], controlsRemoteRevisionNew: [newControl] }));
    const card = screen.getByTestId(`diff-card-1-added`);
    expect(within(card).getByText('added')).toBeInTheDocument();
    expect(within(card).getByText(newControl.label)).toBeInTheDocument();
    expect(within(card).getByText(newControl.name, { exact: false })).toBeInTheDocument();
  });

  it('shows removal', () => {
    const oldControl = createControl({ type: 'number', name: 'number_1', label: 'number label' });
    render(SurveyDiff, createOptions({ controlsRemoteRevisionOld: [oldControl], controlsRemoteRevisionNew: [] }));
    const card = screen.getByTestId(`diff-card-1-removed`);
    expect(within(card).getByText('removed')).toBeInTheDocument();
    expect(within(card).getByText(oldControl.label)).toBeInTheDocument();
    expect(within(card).getByText(oldControl.name, { exact: false })).toBeInTheDocument();
  });
  it('shows unchanged parent if its children changed', () => {
    const number = createControl({ type: 'number', name: 'number_1', label: 'number label' });
    const page = createControl({ type: 'page', name: 'page_1', label: 'page label' });
    const oldControls = [page];
    const newControls = cloneDeep(oldControls);
    newControls[0].children = [number];

    render(
      SurveyDiff,
      createOptions({ controlsRemoteRevisionOld: oldControls, controlsRemoteRevisionNew: newControls })
    );
    const pageCard = screen.getByTestId(`diff-card-1-unchanged`);
    expect(within(pageCard).getByText('unchanged')).toBeInTheDocument();
    expect(within(pageCard).getByText(page.label)).toBeInTheDocument();
    expect(within(pageCard).getByText(page.name, { exact: false })).toBeInTheDocument();

    const numberCard = within(pageCard).getByTestId(`diff-card-1.1-added`);
    expect(within(numberCard).getByText('added')).toBeInTheDocument();
    expect(within(numberCard).getByText(number.label)).toBeInTheDocument();
    expect(within(numberCard).getByText(number.name, { exact: false })).toBeInTheDocument();
  });
  it('can show unchangeds', () => {
    const unchanged = createControl({ type: 'number', name: 'number_1', label: 'number label' });
    const added = createControl({ type: 'number', name: 'number_2', label: 'number added' });
    render(
      SurveyDiff,
      createOptions({
        controlsRemoteRevisionOld: [unchanged],
        controlsRemoteRevisionNew: [unchanged, added],
        defaultShowUnchanged: true,
      })
    );
    const card = screen.getByTestId(`diff-card-1-unchanged`);
    expect(within(card).getByText('unchanged')).toBeInTheDocument();
    expect(within(card).getByText(unchanged.label)).toBeInTheDocument();
    expect(within(card).getByText(unchanged.name, { exact: false })).toBeInTheDocument();
  });

  it('shows diff for matrix rows', async () => {
    const oldMatrix = createControl({ type: 'matrix', name: 'matrix_1', label: 'matrix label' });
    const newMatrix = cloneDeep(oldMatrix);
    newMatrix.name = 'changed name';
    newMatrix.options.source.config.addRowLabel = 'changed add row label';
    newMatrix.options.source.content[0].type = 'text';
    newMatrix.options.source.content[1].label = 'changed';

    render(
      SurveyDiff,
      createOptions({ controlsRemoteRevisionOld: [oldMatrix], controlsRemoteRevisionNew: [newMatrix] })
    );
    const card = screen.getByTestId(`diff-card-1-changed`);
    await fireEvent.click(card.firstElementChild);
    hasDiffRow(card, 'name', oldMatrix.name, newMatrix.name);
    hasDiffRow(
      card,
      'options.source.config.addRowLabel',
      oldMatrix.options.source.config.addRowLabel,
      newMatrix.options.source.config.addRowLabel
    );
    hasDiffRow(
      card,
      'options.source.content[0].type',
      oldMatrix.options.source.content[0].type,
      newMatrix.options.source.content[0].type
    );
    hasDiffRow(
      card,
      'options.source.content[1].label',
      oldMatrix.options.source.content[1].label,
      newMatrix.options.source.content[1].label
    );
  });
});

describe('computed.diffInfoTree', () => {
  const colors = SurveyDiff.data().colors;
  const componentThis = (diff) => ({ diff, colors, getControlChangeList: SurveyDiff.methods.getControlChangeList });

  it('converts normalized diff into the correct format', () => {
    const oldControl = createControl({ type: 'number', name: 'number_1', label: 'old label', id: 'num_id' });
    const newControl = { ...cloneDeep(oldControl), label: 'new label' };
    const diff = diffSurveyVersions([oldControl], [newControl]);
    const diffTree = SurveyDiff.computed.diffInfoTree.call(componentThis(diff));
    expect(diffTree).toMatchObject([
      {
        ...pick(newControl, 'name', 'label', 'controlType'),
        color: colors[CHANGED],
        changeType: CHANGED,
        changeList: [
          {
            key: 'label',
            oldValue: JSON.stringify(oldControl.label),
            newValue: JSON.stringify(newControl.label),
          },
        ],
        indexPath: '1',
        children: [],
      },
    ]);
  });

  it('rebuilds the control tree', () => {
    const number = createControl({ type: 'number', name: 'number_1' });
    const string = createControl({ type: 'string', name: 'string_1' });
    const group = createControl({ type: 'group', name: 'group_1', children: [number, string] });
    const matrix = createControl({ type: 'matrix', name: 'matrix_1' });
    const page = createControl({ type: 'page', name: 'page_1', children: [group, matrix] });
    const script = createControl({ type: 'script', name: 'script_1' });
    const oldControls = [page];
    const newControls = [cloneDeep(page), script];
    newControls[0].children.pop(); // remove matrix from page

    const diff = diffSurveyVersions(oldControls, newControls);
    const diffTree = SurveyDiff.computed.diffInfoTree.call(componentThis(diff));
    expect(diffTree).toMatchObject([
      {
        name: page.name,
        changeType: UNCHANGED,
        children: [
          {
            name: group.name,
            changeType: UNCHANGED,
            children: [
              { name: number.name, changeType: UNCHANGED },
              { name: string.name, changeType: UNCHANGED },
            ],
          },
          { name: matrix.name, changeType: REMOVED },
        ],
      },
      { name: script.name, changeType: ADDED },
    ]);
  });

  it('reads the card info from the old control on removal', () => {
    const oldControl = createControl({ type: 'number', name: 'number_1', label: 'old label', id: 'num_id' });
    const diff = diffSurveyVersions([oldControl], []);
    const diffTree = SurveyDiff.computed.diffInfoTree.call(componentThis(diff));
    expect(diffTree).toMatchObject([
      {
        ...pick(oldControl, 'name', 'label', 'controlType'),
        color: colors[REMOVED],
        changeType: REMOVED,
        changeList: [],
        indexPath: '1',
        children: [],
      },
    ]);
  });

  it('sorts controls into the original order', () => {
    const control1 = createControl({ type: 'number', name: 'control_1' });
    const control2 = createControl({ type: 'number', name: 'control_2' });
    const control3 = createControl({ type: 'number', name: 'control_3' });
    const control4 = createControl({ type: 'number', name: 'control_4' });
    const control5 = createControl({ type: 'number', name: 'control_5' });
    const control6 = createControl({ type: 'number', name: 'control_6' });
    const page = createControl({ type: 'page', name: 'page_1', children: [control4, control5, control6] });
    const oldControls = [control1, control2, control3, page];
    const newControls = cloneDeep(oldControls);

    // replace a control with another
    const control2_new = createControl({ type: 'number', name: 'control_2_new' });
    newControls[1] = control2_new;
    // insert a control between 5 and 6
    const control56 = createControl({ type: 'number', name: 'control_btwn_5_6' });
    newControls[3].children.splice(2, 0, control56);
    // remove control 4
    newControls[3].children.shift();

    // make sure that the diff list is in random order
    range(12).forEach(() => {
      const diff = shuffle(diffSurveyVersions(oldControls, newControls));
      const diffTree = SurveyDiff.computed.diffInfoTree.call(componentThis(diff));
      expect(diffTree).toMatchObject([
        { name: control1.name, changeType: UNCHANGED, children: [] },
        { name: control2.name, changeType: REMOVED, children: [] },
        { name: control2_new.name, changeType: ADDED, children: [] },
        { name: control3.name, changeType: UNCHANGED, children: [] },
        {
          name: page.name,
          changeType: UNCHANGED,
          children: [
            { name: control4.name, changeType: REMOVED, children: [] },
            { name: control5.name, changeType: UNCHANGED, children: [] },
            { name: control56.name, changeType: ADDED, children: [] },
            { name: control6.name, changeType: UNCHANGED, children: [] },
          ],
        },
      ]);
    });
  });
});
