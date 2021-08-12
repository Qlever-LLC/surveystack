/* eslint-disable no-unused-vars */
export default {
  type: 'inputLocation',
  name: 'location',
  label: 'Pick Location',

  /**
  * how to display value in table
  * @param {*} value
  */
  valueToString(control, value) {
    return `${value.lat} / ${value.lng}`;
  },
  /**
   * create a href from value, return null if not supported
   * (helpful for scripts / google maps link for lat, long)
   */
  valueToLinks(control) {
    return [
      {
        text: 'mdi-map',
        link: 'https://link-to-map',
      },
      {
        text: 'source',
        link: 'https://link-to-map',
      },
    ];
  },
  /**
   * create a list of URLs to cache offline
   */
  resourceURLs(control) {
    return [
      'https://url-to-image',
    ];
  },
};
