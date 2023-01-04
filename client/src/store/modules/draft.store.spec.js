import draftStore from './draft.store';
import { createSurvey } from '@/utils/surveys';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import { addRevisionToSurvey, createControl } from '@/../tests/surveyTestingUtils';

const { actions, mutations } = draftStore;

describe('draft store', () => {
  describe('actions', () => {
    describe('init', () => {
      const run = async () => {
        const payload = { survey: {}, submission: {}, persist: {} };
        const call = jest.fn();
        const dispatch = call.bind(null, 'dispatch');
        const commit = call.bind(null, 'commit');
        await actions.init({ dispatch, commit }, payload);

        return { payload, call };
      };
      it('commits INIT', async () => {
        const { call, payload } = await run();
        expect(call).toHaveBeenNthCalledWith(1, 'commit', 'INIT', payload);
        // passes down the given payload to the mutation
        expect(call.mock.calls[0][2].survey).toBe(payload.survey);
        expect(call.mock.calls[0][2].submission).toBe(payload.submission);
        expect(call.mock.calls[0][2].persist).toBe(payload.persist);
      });
      it('dispatches calculateRelevance', async () => {
        const { call, payload } = await run();
        expect(call).toHaveBeenNthCalledWith(2, 'dispatch', 'calculateRelevance');
      });

      it('dispatches next', async () => {
        const { call, payload } = await run();
        await expect(call).toHaveBeenNthCalledWith(3, 'dispatch', 'next');
      });
    });
    describe('next', () => {
      // marker control ID's to setup the initial state
      const INITIAL_FIRST_CONTROL_ID = 'first-node';
      const INITIAL_CURRENT_CONTROL_ID = 'current-node'; // if not set, it'll be the same as the first
      const EXPECTED_NEXT_CONTROL_ID = 'next-node'; // if not set, commit('SHOW_OVERVIEW', true) is expected

      const createStateWithControls = (controls) => {
        const survey = {
          ...createSurvey({ group: { id: null, path: null } }),
        };
        addRevisionToSurvey(survey, controls);
        const submission = createSubmissionFromSurvey({ survey, version: survey.latestVersion });
        const state = {};
        mutations.INIT(state, { survey, submission, persist: false });

        // setup the submission draft state
        const currentNode = state.root.first(({ model }) => model.id === INITIAL_CURRENT_CONTROL_ID);
        const firstNode = state.root.first(({ model }) => model.id === INITIAL_FIRST_CONTROL_ID);
        state.node = currentNode || firstNode || null;
        state.firstNode = firstNode || null;

        return state;
      };

      const runTestWithControls = async (controls) => {
        const state = createStateWithControls(controls);
        const nextNode = state.root.first(({ model }) => model.id === EXPECTED_NEXT_CONTROL_ID);

        const dispatch = jest.fn();
        const commit = jest.fn();
        await actions.next({ state, dispatch, commit });

        if (nextNode) {
          expect(commit).toHaveBeenCalledWith('NEXT', nextNode);
        } else {
          expect(commit).toHaveBeenCalledWith('SHOW_OVERVIEW', true);
        }
      };
      it('steps to the next control', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'string', id: INITIAL_CURRENT_CONTROL_ID }),
          createControl({ type: 'date', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('steps to first control at start', async () =>
        await runTestWithControls([
          createControl({ type: 'instructions', id: EXPECTED_NEXT_CONTROL_ID }),
          createControl({ type: 'number', id: 'second-control' }),
        ]));
      it('shows overview after the last control', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'farmOsField', id: INITIAL_CURRENT_CONTROL_ID }),
        ]));
      it('steps over empty page', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'page', id: 'first-empty-page' }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('steps over empty page at start', async () =>
        await runTestWithControls([
          createControl({ type: 'page', id: 'first-empty-page' }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('steps over empty group', async () =>
        await runTestWithControls([
          createControl({ type: 'page', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'group', id: 'empty-group' }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('steps over empty group at start', async () =>
        await runTestWithControls([
          createControl({ type: 'group', id: 'empty-group' }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('steps into group', async () =>
        await runTestWithControls([
          createControl({ type: 'string', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({
            type: 'group',
            children: [
              createControl({ type: 'matrix', id: EXPECTED_NEXT_CONTROL_ID }),
              createControl({ type: 'geoJSON' }),
            ],
          }),
          createControl({ type: 'number' }),
        ]));
      it('selects a page if it has controls', async () =>
        await runTestWithControls([
          createControl({
            type: 'page',
            id: EXPECTED_NEXT_CONTROL_ID,
            children: [createControl({ type: 'string' }), createControl({ type: 'location' })],
          }),
          createControl({ type: 'number' }),
        ]));
      it('does not select the children of a page', async () =>
        await runTestWithControls([
          createControl({
            type: 'page',
            id: INITIAL_FIRST_CONTROL_ID,
            children: [createControl({ type: 'string' }), createControl({ type: 'location' })],
          }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('skips hidden control', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'number', id: 'hidden-control', options: { hidden: true } }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));

      it('skips hidden page control', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({
            type: 'page',
            id: 'hidden-control',
            options: { hidden: true },
            children: [createControl({ type: 'string' }), createControl({ type: 'location' })],
          }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('does not skip the children of a hidden group control', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({
            type: 'group',
            id: 'hidden-control',
            options: { hidden: true },
            children: [
              createControl({ type: 'string', id: EXPECTED_NEXT_CONTROL_ID }),
              createControl({ type: 'location' }),
            ],
          }),
          createControl({ type: 'number' }),
        ]));
      it('skips hidden control at start', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: 'hidden-control', options: { hidden: true } }),
          createControl({ type: 'number', id: EXPECTED_NEXT_CONTROL_ID }),
        ]));
      it('skips hidden control at the end', async () =>
        await runTestWithControls([
          createControl({ type: 'number', id: INITIAL_FIRST_CONTROL_ID }),
          createControl({ type: 'number', id: 'hidden-control', options: { hidden: true } }),
        ]));
    });
  });

  describe('mutations', () => {
    describe('INIT', () => {
      const createPayload = (controls = []) => {
        const survey = {
          ...createSurvey({ group: { id: null, path: null } }),
        };
        const submission = createSubmissionFromSurvey({ survey, version: survey.latestVersion });
        return { survey, submission, persist: false };
      };
      const run = (state = {}, payload = {}) => {
        payload = { ...createPayload(), ...payload };
        mutations.INIT(state, payload);

        return state;
      };
      it('adds payload to state', () => {
        const payload = createPayload();
        const state = run({}, payload);
        expect(state.survey).toBe(payload.survey);
        expect(state.submission).toBe(payload.submission);
        expect(state.persist).toBe(payload.persist);
      });
      it('resets state', () => {
        const state = {
          showOverview: true,
          showConfirmSubmission: true,
          node: {},
          firstNode: {},
          errors: {},
        };
        run(state);
        expect(state.showOverview).toBe(false);
        expect(state.showConfirmSubmission).toBe(false);
        expect(state.node).toBeNull();
        expect(state.firstNode).toBeNull();
        expect(state.errors).toBeNull();
      });

      it('sets state.root', () => {
        const state = {
          root: null,
        };
        run(state);
        expect(state.root).toEqual(expect.any(Object));
      });

      it('reads the controls from the correct revision', () => {
        const { survey } = createPayload();
        addRevisionToSurvey(survey, [createControl({ type: 'number' })]);
        const revNotLatest = addRevisionToSurvey(survey, [createControl({ type: 'string' })]);
        addRevisionToSurvey(survey, [createControl({ type: 'date' })]);
        const submission = createSubmissionFromSurvey({ survey, version: revNotLatest.version });

        const state = run({}, { survey, submission });

        expect(state.root.model.children).toMatchObject(revNotLatest.controls);
      });
    });

    describe('NEXT', () => {
      it('sets state.node', () => {
        const state = {};
        const node = {};
        mutations.NEXT(state, node);
        expect(state.node).toBe(node);
      });
      it('sets state.firstNode if it is not set', () => {
        const state = {};
        const node = {};
        mutations.NEXT(state, node);
        expect(state.node).toBe(node);
      });
      it('does not set state.firstNode if it is already set', () => {
        const state = { node: {}, firstNode: {} };
        mutations.NEXT(state, {});
        expect(state.firstNode).toBe(state.firstNode);
      });
    });
  });
});
