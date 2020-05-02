/**
 * ApiCompose
 *
 * @param {submission} submission
 */
function apiCompose(submission) {
  const farmosRequest = {
    type: 'farmos',
    farmosType: 'log',
  };

  farmosRequest.url = submission.data.field.value.url;
  const { fieldId } = submission.data.field.value;
  const crop = submission.data.crop.value;
  const date = submission.data.seeding_date.value;

  if (!farmosRequest.url || !fieldId) {
    throw 'Please select field';
  }

  if (!crop) {
    throw 'Please select crop';
  }

  if (!date) {
    throw 'Please select seeding date';
  }


  farmosRequest.body = {
    date,
    name: `Seeding of ${crop}`,
    type: 'farm_seeding',
    done: 1,
    movement: {
      area: [
        {
          id: fieldId,
        },
      ],
    },
    asset: [{ id: '$PLANTING' }],
  };

  return farmosRequest;
}
