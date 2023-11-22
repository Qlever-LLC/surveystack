import { render } from '@testing-library/vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

import { createLocalVue } from '@vue/test-utils';
import ABtnToggle from '../src/components/ui/elements/ABtnToggle.vue';
import AChip from '../src/components/ui/elements/AChip.vue';
import ADivider from '../src/components/ui/elements/ADivider.vue';
import AExpansionPanel from '../src/components/ui/elements/AExpansionPanel.vue';
import AExpansionPanels from '../src/components/ui/elements/AExpansionPanels.vue';
import AExpansionPanelText from '../src/components/ui/elements/AExpansionPanelText.vue';
import AExpansionPanelTitle from '../src/components/ui/elements/AExpansionPanelTitle.vue';
import AFileInput from '../src/components/ui/elements/AFileInput.vue';
import AImg from '../src/components/ui/elements/AImg.vue';
import AInput from '../src/components/ui/elements/AInput.vue';
import AList from '../src/components/ui/elements/AList.vue';
import AListGroup from '../src/components/ui/elements/AListGroup.vue';
import AMenu from '../src/components/ui/elements/AMenu.vue';
import ARadio from '../src/components/ui/elements/ARadio.vue';
import ARadioGroup from '../src/components/ui/elements/ARadioGroup.vue';
import ASelect from '../src/components/ui/elements/ASelect.vue';
import ASheet from '../src/components/ui/elements/ASheet.vue';
import ASwitch from '../src/components/ui/elements/ASwitch.vue';
import ATextField from '../src/components/ui/elements/ATextField.vue';
import ASpeedDial from '../src/components/ui/elements/ASpeedDial.vue';
import AAlert from '../src/components/ui/elements/AAlert.vue';
import AForm from '../src/components/ui/elements/AForm.vue';
import ATable from '../src/components/ui/elements/ATable.vue';
import ATooltip from '../src/components/ui/elements/ATooltip.vue';
import ACheckbox from '../src/components/ui/elements/ACheckbox.vue';
import ASpacer from '../src/components/ui/elements/ASpacer.vue';
import AToolbar from '../src/components/ui/elements/AToolbar.vue';
import AListItemAction from '../src/components/ui/elements/AListItemAction.vue';
import AListItemSubtitle from '../src/components/ui/elements/AListItemSubtitle.vue';
import AListItemTitle from '../src/components/ui/elements/AListItemTitle.vue';
import AListItem from '../src/components/ui/elements/AListItem.vue';
import AToolbarTitle from '../src/components/ui/elements/AToolbarTitle.vue';
import ABanner from '../src/components/ui/elements/ABanner.vue';
import ABadge from '../src/components/ui/elements/ABadge.vue';
import ATab from '../src/components/ui/elements/ATab.vue';
import AIcon from '../src/components/ui/elements/AIcon.vue';
import ASnackbar from '../src/components/ui/elements/ASnackbar.vue';
import ARow from '../src/components/ui/elements/ARow.vue';
import ATextarea from '../src/components/ui/elements/ATextarea.vue';
import ATabs from '../src/components/ui/elements/ATabs.vue';
import AToolbarItems from '../src/components/ui/elements/AToolbarItems.vue';
import AProgressCircular from '../src/components/ui/elements/AProgressCircular.vue';
import AProgressLinear from '../src/components/ui/elements/AProgressLinear.vue';

const localVue = createLocalVue();
localVue.component('a-btn-toggle', ABtnToggle);
localVue.component('a-chip', AChip);
localVue.component('a-divider', ADivider);
localVue.component('a-expansion-panel', AExpansionPanel);
localVue.component('a-expansion-panels', AExpansionPanels);
localVue.component('a-expansion-panel-text', AExpansionPanelText);
localVue.component('a-expansion-panel-title', AExpansionPanelTitle);
localVue.component('a-file-input', AFileInput);
localVue.component('a-img', AImg);
localVue.component('a-input', AInput);
localVue.component('a-list', AList);
localVue.component('a-list-group', AListGroup);
localVue.component('a-menu', AMenu);
localVue.component('a-radio', ARadio);
localVue.component('a-radio-group', ARadioGroup);
localVue.component('a-select', ASelect);
localVue.component('a-sheet', ASheet);
localVue.component('a-switch', ASwitch);
localVue.component('a-text-field', ATextField);
localVue.component('a-speed-dial', ASpeedDial);
localVue.component('a-alert', AAlert);
localVue.component('a-form', AForm);
localVue.component('a-table', ATable);
localVue.component('a-tooltip', ATooltip);
localVue.component('a-checkbox', ACheckbox);
localVue.component('a-spacer', ASpacer);
localVue.component('a-toolbar', AToolbar);
localVue.component('a-list-item-action', AListItemAction);
localVue.component('a-list-item-subtitle', AListItemSubtitle);
localVue.component('a-list-item-title', AListItemTitle);
localVue.component('a-list-item', AListItem);
localVue.component('a-toolbar-title', AToolbarTitle);
localVue.component('a-banner', ABanner);
localVue.component('a-badge', ABadge);
localVue.component('a-tab', ATab);
localVue.component('a-icon', AIcon);
localVue.component('a-snackbar', ASnackbar);
localVue.component('a-row', ARow);
localVue.component('a-textarea', ATextarea);
localVue.component('a-tabs', ATabs);
localVue.component('a-toolbar-items', AToolbarItems);
localVue.component('a-progress-circular', AProgressCircular);
localVue.component('a-progress-linear', AProgressLinear);

localVue.use(Vuex);
localVue.use(VueRouter);

const renderWithVuetify = function (component, options, callback) {
  const root = document.createElement('div');
  root.setAttribute('data-app', 'true');

  return render(
    component,
    {
      container: document.body.appendChild(root),
      // for Vuetify components that use the $vuetify instance property
      vuetify: new Vuetify(),
      localVue,
      ...options,
    },
    callback
  );
};

export { renderWithVuetify, localVue };
