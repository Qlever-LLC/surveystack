import { render, fireEvent, prettyDOM, findByText, getByTestId, getByLabelText } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import vuetify from '@/plugins/vuetify';
import { availableControls } from '@/utils/surveyConfig';
import router from '@/router';
import { isString, last } from 'lodash';

describe.only('add control', () => {
  const addControl = async (container, type, { dataName, label, hint, moreInfo } = {}) => {
    await fireEvent.click(getByTestId(container, 'control-adder-open'));
    await fireEvent.click(getByTestId(container, `add-control-${type}`));

    const fields = [
      [dataName, 'Data name'],
      [label, 'Label'],
      [hint, 'Hint'],
      [moreInfo, 'More info'],
    ];
    for (const [value, domLabel] of fields) {
      if (isString(value)) {
        const props = getByTestId(container, 'control-properties');
        await fireEvent.update(getByLabelText(props, domLabel), value);
      }
    }
  };

  availableControls
    .filter(({ type }) => type !== 'script') // TODO load scripts from vuex instead of getting them from the server
    .forEach((info) => {
      it(`can add ${info.type} type control`, async () => {
        const survey = { ...createSurvey({ group: { id: null, path: null } }), name: 'survey name', id: 'survey_id' };
        const props = { survey };
        const store = createStoreObject();
        const spyDraftInit = jest.spyOn(store.modules.draft.actions, 'init');
        const { getByTestId, container, getByText } = render(SurveyBuilder, {
          props,
          router,
          vuetify,
          store,
        });

        const label = `Test add ${info.type}`;
        const dataName = 'some_control';
        await addControl(container, info.type, { label, dataName });

        // adds control to the graphical view
        await findByText(getByTestId('graphical-view'), label);

        // saves the control to the draft store
        await fireEvent.click(getByText('Save'));
        expect(spyDraftInit).toHaveBeenCalled();
        const control = last(spyDraftInit.mock.calls)[1].survey.revisions[1].controls[0];
        expect(control).toEqual(expect.objectContaining({ name: dataName, label, type: info.type }));
      });
    });
});
