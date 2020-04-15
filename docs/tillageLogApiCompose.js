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

  farmosRequest.terms = [
    {
      sym: '$TILLAGE_LOG_CATEGORY',
      name: 'Tillage',
      machine: 'farm_log_categories',
    },
    {
      sym: '$INCHES',
      name: 'inches',
      machine: 'farm_quantity_units',
    },
  ];

  farmosRequest.url = submission.data.planting_group.field.value.url;


  farmosRequest.body = {
    date: submission.data.planting_group.planting_date.value,
    name: 'Tillage',
    type: 'farm_activity',
    done: 1,
    area: [{ id: submission.data.planting_group.field.value.fieldId }],
    // asset: [{ id: "$PLANTING" }],
    log_category: [{ id: '$TILLAGE_LOG_CATEGORY' }],
    quantity: [
      {
        measure: 'length',
        value: 25,
        unit: {
          id: '$INCHES',
        },
        label: 'Depth',
      },
    ],
  };

  return farmosRequest;
}
