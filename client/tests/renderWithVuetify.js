import { render } from '@testing-library/vue';
import { mount, shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { vuetify } from '../src/plugins/vuetify';
import { createStoreObject } from '../src/store';
import { createAppRouter } from '../src/router';

import AAlert from '../src/components/ui/elements/AAlert.vue';
import AApp from '../src/components/ui/elements/AApp.vue';
import AAppBar from '../src/components/ui/elements/AAppBar.vue';
import AAppBarNavIcon from '../src/components/ui/elements/AAppBarNavIcon.vue';
import AAvatar from '../src/components/ui/elements/AAppBarNavIcon.vue';
import ABadge from '../src/components/ui/elements/ABadge.vue';
import ABanner from '../src/components/ui/elements/ABanner.vue';
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
import ADataTableServer from '../src/components/ui/elements/ADataTableServer.vue';
import ADate from '../src/components/ui/elements/ADate.vue';
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
import AHover from '../src/components/ui/elements/AHover.vue';
import AIcon from '../src/components/ui/elements/AIcon.vue';
import AImg from '../src/components/ui/elements/AImg.vue';
import AInput from '../src/components/ui/elements/AInput.vue';
import ALabel from '../src/components/ui/elements/ALabel.vue';
import AList from '../src/components/ui/elements/AList.vue';
import AListItem from '../src/components/ui/elements/AListItem.vue';
import AListItemAction from '../src/components/ui/elements/AListItemAction.vue';
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
import AToolbarTitle from '@/components/ui/elements/AAppBarTitle.vue';
import ATooltip from '../src/components/ui/elements/ATooltip.vue';
import AWindow from '../src/components/ui/elements/AWindow.vue';
import AWindowItem from '../src/components/ui/elements/AWindowItem.vue';

import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlError from '@/components/survey/drafts/ControlError.vue';

const components = {
  'a-alert': AAlert,
  'a-app': AApp,
  'a-app-bar': AAppBar,
  'a-app-bar-nav-icon': AAppBarNavIcon,
  'a-avatar': AAvatar,
  'a-badge': ABadge,
  'a-banner': ABanner,
  'a-btn': ABtn,
  'a-btn-toggle': ABtnToggle,
  'a-card': ACard,
  'a-card-actions': ACardActions,
  'a-card-subtitle': ACardSubtitle,
  'a-card-text': ACardText,
  'a-card-title': ACardTitle,
  'a-checkbox': ACheckbox,
  'a-chip': AChip,
  'a-col': ACol,
  'a-container': AContainer,
  'a-data-table-server': ADataTableServer,
  'a-date': ADate,
  'a-date-picker': ADatePicker,
  'a-dialog': ADialog,
  'a-divider': ADivider,
  'a-expand-transition': AExpandTransition,
  'a-expansion-panel': AExpansionPanel,
  'a-expansion-panels': AExpansionPanels,
  'a-expansion-panel-text': AExpansionPanelText,
  'a-expansion-panel-title': AExpansionPanelTitle,
  'a-fab-transition': AFabTransition,
  'a-file-input': AFileInput,
  'a-flex': AFlex,
  'a-form': AForm,
  'a-hover': AHover,
  'a-icon': AIcon,
  'a-img': AImg,
  'a-input': AInput,
  'a-label': ALabel,
  'a-list': AList,
  'a-list-item': AListItem,
  'a-list-item-action': AListItemAction,
  'a-list-item-subtitle': AListItemSubtitle,
  'a-list-item-title': AListItemTitle,
  'a-list-subheader': AListSubheader,
  'a-main': AMain,
  'a-menu': AMenu,
  'a-navigation-drawer': ANavigationDrawer,
  'a-overlay': AOverlay,
  'a-pagination': APagination,
  'a-progress-circular': AProgressCircular,
  'a-progress-linear': AProgressLinear,
  'a-radio': ARadio,
  'a-radio-group': ARadioGroup,
  'a-row': ARow,
  'a-select': ASelect,
  'a-sheet': ASheet,
  'a-skeleton-loader': ASkeletonLoader,
  'a-snackbar': ASnackbar,
  'a-spacer': ASpacer,
  'a-switch': ASwitch,
  'a-tab': ATab,
  'a-table': ATable,
  'a-tabs': ATabs,
  'a-textarea': ATextarea,
  'a-text-field': ATextField,
  'a-timeline': ATimeline,
  'a-timeline-item': ATimelineItem,
  'a-toolbar': AToolbar,
  'a-toolbar-items': AToolbarItems,
  'a-toolbar-title': AToolbarTitle,
  'a-tooltip': ATooltip,
  'a-window': AWindow,
  'a-window-item': AWindowItem,
  'app-control-label': appControlLabel,
  'app-control-hint': appControlHint,
  'app-control-more-info': appControlMoreInfo,
  'app-control-error': appControlError,
};

const createTestUtilsWrapper = (testUtilsMethod) =>
  function (component, options) {
    const store = createStore(createStoreObject());
    return testUtilsMethod(component, {
      ...options,
      global: {
        plugins: [vuetify, store],
        components,
        ...options?.global,
      },
    });
  };
const mountWithVuetify = createTestUtilsWrapper(mount);
const shallowMountWithVuetify = createTestUtilsWrapper(shallowMount);

const renderWithVuetify = function (component, options, storeOverride, routerOverride, tanstackVueQueryOverride) {
  const root = document.createElement('div');
  root.setAttribute('data-app', 'true');
  const router = routerOverride ?? createAppRouter();
  const store = storeOverride ?? createStore(createStoreObject());
  const tanstackVueQuery = tanstackVueQueryOverride ?? undefined;
  const renderOptions = {
    ...options,
    container: document.body.appendChild(root),
    global: {
      plugins: [vuetify, store, router, tanstackVueQuery],
      components,
      stubs: {
        CodeEditor: { template: '<span id="CodeEditorStub" />' },
        InstructionsEditor: { template: '<span id="InstructionsEditor" />' },
      },
      ...options?.global,
    },
  };

  return render(component, renderOptions);
};

export { renderWithVuetify, mountWithVuetify, shallowMountWithVuetify };
