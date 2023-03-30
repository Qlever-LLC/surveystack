/**
 * ApiCompose
 *
 * WARNING: This is for FARMOS 1.0 and won't work anymore
 *
 * @param {submission} submission
 */
function apiCompose(submission) {
  const farmosRequest = {
    type: 'farmos',
    farmosType: 'log',
  };

  farmosRequest.url = submission.data.field.value.url;
  farmosRequest.terms = [];

  const { id } = submission.data.field.value;
  const crop = submission.data.crop.value;
  const date = submission.data.seeding_date.value;

  if (!farmosRequest.url || !id) {
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
          id: id,
        },
      ],
    },
    asset: [{ id: '$PLANTING' }],
  };

  return farmosRequest;
}
