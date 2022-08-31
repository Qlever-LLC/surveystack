/* eslint-disable no-undef */

import TreeModel from 'tree-model';

import * as case1 from '../submissions/case1';
import * as surveyStackUtils from '../../src/utils/surveyStack';
import * as codeEvaluator from '../../src/utils/codeEvaluator';

describe('order apiCompose', () => {
  it('first', async () => {
    const { submission, survey } = case1;

    order = jest.fn();

    const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });

    const nodes = surveyStackUtils.getAllNodes(root);
    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, submission, survey);

    console.log(order.mock.calls);
  });
});
