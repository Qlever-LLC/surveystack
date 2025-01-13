const hues = [
  143.5,
  166,
  177.25,
  188.5,
  199.75,
  211,
  222.25,
  233.5,
  256,
  267.25,
  278.5,
  289.75,
  301,
  323.5,
  334.75,
  346,
  8.5,
  19.75,
  31,
  42.25,
  53.5,
  64.75,
  76,
  98.5,
  121,
];

export default function getGroupColor(hexDigestString) {
  const value = parseInt(hexDigestString, 16);
  const hue = hues[value % hues.length];
  return `hsl(${hue}, 70%, 40%)`;
}
