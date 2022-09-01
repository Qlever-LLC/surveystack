import TreeModel from 'tree-model';

import * as case0 from '../submissions/case0';
import * as case1 from '../submissions/case1';
import * as case2 from '../submissions/case2';
import * as surveyStackUtils from '../../src/utils/surveyStack';
import * as codeEvaluator from '../../src/utils/codeEvaluator';

describe('order apiCompose', () => {
  it('linear text - text - text', async () => {
    const { submission, survey } = case0;

    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();

    const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });

    const nodes = surveyStackUtils.getAllNodes(root);
    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, submission, survey);

    expect(consoleWarnMock.mock.calls.toString()).toBe('1,2,3');
  });

  it('linear text - text in group - text in group', async () => {
    const { submission, survey } = case1;

    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();

    const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });

    const nodes = surveyStackUtils.getAllNodes(root);

    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, submission, survey);

    expect(consoleWarnMock.mock.calls.toString()).toBe('1,2,3,4,5');
  });

  it('linear text - text in grp in grp in grp - text in grp in page - 2 texts in page', async () => {
    const { submission, survey } = case2;

    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();

    const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });

    const nodes = surveyStackUtils.getAllNodes(root);

    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, submission, survey);

    expect(consoleWarnMock.mock.calls.toString()).toBe('1,2,3,4,5,6,7,8,9,10,11');
  });
});
