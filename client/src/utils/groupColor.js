export default function getGroupColor(hexDigestString) {
  const value = parseInt(hexDigestString, 16);
  const hue = value % 360;
  console.log({hexDigestString, hue});
  return `hsl(${hue}, 70%, 40%)`;
}
