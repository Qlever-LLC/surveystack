import { render } from '@testing-library/vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

import { createLocalVue } from '@vue/test-utils';
import AAlert from '../src/components/ui/elements/AAlert.vue';
import AApp from '../src/components/ui/elements/AApp.vue';
import AAppBar from '../src/components/ui/elements/AAppBar.vue';
import AAppBarNavIcon from '../src/components/ui/elements/AAppBarNavIcon.vue';
import AAvatar from '../src/components/ui/elements/AAppBarNavIcon.vue';
import ABadge from '../src/components/ui/elements/ABadge.vue';
import ABanner from '../src/components/ui/elements/ABanner.vue';
import ABreadcrumbs from '../src/components/ui/elements/ABreadcrumbs.vue';
import ABtn from '../src/components/ui/elements/ABtn.vue';
import ABtnToggle from '../src/components/ui/elements/ABtnToggle.vue';
import ACard from '../src/components/ui/elements/ACard.vue';
import ACardActions from '../src/components/ui/elements/ACardActions.vue';
import ACardSubtitle from '../src/components/ui/elements/ACardSubtitle.vue';
import ACardText from '../src/components/ui/elements/ACardText.vue';
import ACardTitle from '../src/components/ui/elements/ACardTitle.vue';
import ACheckbox from '../src/components/ui/elements/ACheckbox.vue';
import AChip from '../src/components/ui/elements/AChip.vue';
import ACol from '../src/components/ui/elements/ACol.vue';
import AContainer from '../src/components/ui/elements/AContainer.vue';
import ADatePicker from '../src/components/ui/elements/ADatePicker.vue';
import ADialog from '../src/components/ui/elements/ADialog.vue';
import ADivider from '../src/components/ui/elements/ADivider.vue';
import AExpandTransition from '../src/components/ui/elements/AExpandTransition.vue';
import AExpansionPanel from '../src/components/ui/elements/AExpansionPanel.vue';
import AExpansionPanels from '../src/components/ui/elements/AExpansionPanels.vue';
import AExpansionPanelText from '../src/components/ui/elements/AExpansionPanelText.vue';
import AExpansionPanelTitle from '../src/components/ui/elements/AExpansionPanelTitle.vue';
import AFabTransition from '../src/components/ui/elements/AFabTransition.vue';
import AFileInput from '../src/components/ui/elements/AFileInput.vue';
import AFlex from '../src/components/ui/elements/AFlex.vue';
import AForm from '../src/components/ui/elements/AForm.vue';
import AIcon from '../src/components/ui/elements/AIcon.vue';
import AImg from '../src/components/ui/elements/AImg.vue';
import AInput from '../src/components/ui/elements/AInput.vue';
import ALabel from '../src/components/ui/elements/ALabel.vue';
import ALayout from '../src/components/ui/elements/ALabel.vue';
import AList from '../src/components/ui/elements/AList.vue';
import AListGroup from '../src/components/ui/elements/AListGroup.vue';
import AListItem from '../src/components/ui/elements/AListItem.vue';
import AListItemAction from '../src/components/ui/elements/AListItemAction.vue';
import AListItemIcon from '../src/components/ui/elements/AListItemIcon.vue';
import AListItemSubtitle from '../src/components/ui/elements/AListItemSubtitle.vue';
import AListItemTitle from '../src/components/ui/elements/AListItemTitle.vue';
import AListSubheader from '../src/components/ui/elements/AListSubheader.vue';
import AMain from '../src/components/ui/elements/AMain.vue';
import AMenu from '../src/components/ui/elements/AMenu.vue';
import ANavigationDrawer from '../src/components/ui/elements/ANavigationDrawer.vue';
import AOverlay from '../src/components/ui/elements/AOverlay.vue';
import APagination from '../src/components/ui/elements/APagination.vue';
import AProgressCircular from '../src/components/ui/elements/AProgressCircular.vue';
import AProgressLinear from '../src/components/ui/elements/AProgressLinear.vue';
import ARadio from '../src/components/ui/elements/ARadio.vue';
import ARadioGroup from '../src/components/ui/elements/ARadioGroup.vue';
import ARow from '../src/components/ui/elements/ARow.vue';
import ASelect from '../src/components/ui/elements/ASelect.vue';
import ASheet from '../src/components/ui/elements/ASheet.vue';
import ASkeletonLoader from '../src/components/ui/elements/ASkeletonLoader.vue';
import ASnackbar from '../src/components/ui/elements/ASnackbar.vue';
import ASpacer from '../src/components/ui/elements/ASpacer.vue';
import ASpeedDial from '../src/components/ui/elements/ASpeedDial.vue';
import ASwitch from '../src/components/ui/elements/ASwitch.vue';
import ATab from '../src/components/ui/elements/ATab.vue';
import ATable from '../src/components/ui/elements/ATable.vue';
import ATabs from '../src/components/ui/elements/ATabs.vue';
import ATextarea from '../src/components/ui/elements/ATextarea.vue';
import ATextField from '../src/components/ui/elements/ATextField.vue';
import ATimeline from '../src/components/ui/elements/ATimeline.vue';
import ATimelineItem from '../src/components/ui/elements/ATimelineItem.vue';
import AToolbar from '../src/components/ui/elements/AToolbar.vue';
import AToolbarItems from '../src/components/ui/elements/AToolbarItems.vue';
import AToolbarTitle from '../src/components/ui/elements/AToolbarTitle.vue';
import ATooltip from '../src/components/ui/elements/ATooltip.vue';
import AWindow from '../src/components/ui/elements/AWindow.vue';
import AWindowItem from '../src/components/ui/elements/AWindowItem.vue';

const localVue = createLocalVue();
localVue.component('a-alert', AAlert);
localVue.component('a-app', AApp);
localVue.component('a-app-bar', AAppBar);
localVue.component('a-app-bar-nav-icon', AAppBarNavIcon);
localVue.component('a-avatar', AAvatar);
localVue.component('a-badge', ABadge);
localVue.component('a-banner', ABanner);
localVue.component('a-breadcrumbs', ABreadcrumbs);
localVue.component('a-btn', ABtn);
localVue.component('a-btn-toggle', ABtnToggle);
localVue.component('a-card', ACard);
localVue.component('a-card-actions', ACardActions);
localVue.component('a-card-subtitle', ACardSubtitle);
localVue.component('a-card-text', ACardText);
localVue.component('a-card-title', ACardTitle);
localVue.component('a-checkbox', ACheckbox);
localVue.component('a-chip', AChip);
localVue.component('a-col', ACol);
localVue.component('a-container', AContainer);
localVue.component('a-date-picker', ADatePicker);
localVue.component('a-dialog', ADialog);
localVue.component('a-divider', ADivider);
localVue.component('a-expand-transition', AExpandTransition);
localVue.component('a-expansion-panel', AExpansionPanel);
localVue.component('a-expansion-panels', AExpansionPanels);
localVue.component('a-expansion-panel-text', AExpansionPanelText);
localVue.component('a-expansion-panel-title', AExpansionPanelTitle);
localVue.component('a-fab-transition', AFabTransition);
localVue.component('a-file-input', AFileInput);
localVue.component('a-flex', AFlex);
localVue.component('a-form', AForm);
localVue.component('a-icon', AIcon);
localVue.component('a-img', AImg);
localVue.component('a-input', AInput);
localVue.component('a-label', ALabel);
localVue.component('a-layout', ALayout);
localVue.component('a-list', AList);
localVue.component('a-list-group', AListGroup);
localVue.component('a-list-item', AListItem);
localVue.component('a-list-item-action', AListItemAction);
localVue.component('a-list-item-icon', AListItemIcon);
localVue.component('a-list-item-subtitle', AListItemSubtitle);
localVue.component('a-list-item-title', AListItemTitle);
localVue.component('a-list-subheader', AListSubheader);
localVue.component('a-main', AMain);
localVue.component('a-menu', AMenu);
localVue.component('a-navigation-drawer', ANavigationDrawer);
localVue.component('a-overlay', AOverlay);
localVue.component('a-pagination', APagination);
localVue.component('a-progress-circular', AProgressCircular);
localVue.component('a-progress-linear', AProgressLinear);
localVue.component('a-radio', ARadio);
localVue.component('a-radio-group', ARadioGroup);
localVue.component('a-row', ARow);
localVue.component('a-select', ASelect);
localVue.component('a-sheet', ASheet);
localVue.component('a-skeleton-loader', ASkeletonLoader);
localVue.component('a-snackbar', ASnackbar);
localVue.component('a-spacer', ASpacer);
localVue.component('a-speed-dial', ASpeedDial);
localVue.component('a-switch', ASwitch);
localVue.component('a-tab', ATab);
localVue.component('a-table', ATable);
localVue.component('a-tabs', ATabs);
localVue.component('a-textarea', ATextarea);
localVue.component('a-text-field', ATextField);
localVue.component('a-timeline', ATimeline);
localVue.component('a-timeline-item', ATimelineItem);
localVue.component('a-toolbar', AToolbar);
localVue.component('a-toolbar-items', AToolbarItems);
localVue.component('a-toolbar-title', AToolbarTitle);
localVue.component('a-tooltip', ATooltip);
localVue.component('a-window', AWindow);
localVue.component('a-window-item', AWindowItem);

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
