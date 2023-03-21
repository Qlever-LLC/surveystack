const instructionsHeaders = (index = 1) => [`data.instructions_${index}.value`];

const instructionsImageSplitHeaders = (index = 1) => [`data.instructions_split_${index}.value`];

const stringHeaders = (index = 1) => [`data.text_${index}.value`];

const numberHeaders = (index = 1) => [`data.number_${index}.value`];

const dateHeaders = (index = 1) => [`data.date_${index}.value`];

const locationHeaders = (index = 1) => [
  `data.location_${index}.value.type`,
  `data.location_${index}.value.geometry.type`,
  `data.location_${index}.value.geometry.coordinates.0`,
  `data.location_${index}.value.geometry.coordinates.1`,
  `data.location_${index}.value.properties.accuracy`,
];

const selectSingleHeaders = (index = 1) => [`data.multiple_choice_${index}.value.0`];

const selectMultipleHeaders = (index = 1) => [
  `data.checkboxes_${index}.value.0`,
  `data.checkboxes_${index}.value.1`,
];

const ontologyHeaders = (index = 1) => [`data.dropdown_${index}.value.0`];

const matrixHeaders = (index = 1) => [
  `data.matrix_${index}.value.0.property_1.value`,
  `data.matrix_${index}.value.0.property_2.value`,
  `data.matrix_${index}.value.1.property_1.value`,
  `data.matrix_${index}.value.1.property_2.value`,
];

const imageHeaders = (index = 1) => [`data.image_${index}.value.0`];

const fileHeaders = (index = 1) => [`data.file_${index}.value.0`];

const farmOsFieldHeaders = (index = 1) => [
  `data.farmos_field_${index}.value.0.farmName`,
  `data.farmos_field_${index}.value.0.url`,
  `data.farmos_field_${index}.value.0.name`,
  `data.farmos_field_${index}.value.0.id`,
];

const farmOsPlantingHeaders = (index = 1) => [
  `data.farmos_planting_${index}.value.0.archived`,
  `data.farmos_planting_${index}.value.0.id`,
  `data.farmos_planting_${index}.value.0.farmId`,
  `data.farmos_planting_${index}.value.0.farmName`,
  `data.farmos_planting_${index}.value.0.hash`,
  `data.farmos_planting_${index}.value.0.location.0.id`,
  `data.farmos_planting_${index}.value.0.location.0.name`,
  `data.farmos_planting_${index}.value.0.name`,
  `data.farmos_planting_${index}.value.0.url`,
];

const farmOsFarmHeaders = (index = 1) => [`data.farmos_farm_${index}.value.0.url`];

const geoJSONHeaders = (index = 1) => [
  `data.map_${index}.value.features.0.geometry.coordinates.0.0.0`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.0.1`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.1.0`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.1.1`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.2.0`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.2.1`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.3.0`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.3.1`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.4.0`,
  `data.map_${index}.value.features.0.geometry.coordinates.0.4.1`,
  `data.map_${index}.value.features.0.geometry.type`,
  `data.map_${index}.value.features.0.id`,
  `data.map_${index}.value.features.0.properties`,
  `data.map_${index}.value.features.0.type`,
  `data.map_${index}.value.type`,
];

const getSubmissionHeadersGenerator = (control = '') =>
  ({
    instructions: instructionsHeaders,
    instructionsImageSplit: instructionsImageSplitHeaders,
    text: stringHeaders,
    number: numberHeaders,
    date: dateHeaders,
    location: locationHeaders,
    selectSingle: selectSingleHeaders,
    selectMultiple: selectMultipleHeaders,
    ontology: ontologyHeaders,
    matrix: matrixHeaders,
    image: imageHeaders,
    file: fileHeaders,
    farmOsField: farmOsFieldHeaders,
    farmOsPlanting: farmOsPlantingHeaders,
    farmOsFarm: farmOsFarmHeaders,
    geoJSON: geoJSONHeaders,
  }[control]);

export default getSubmissionHeadersGenerator;
