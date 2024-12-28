export default function getAvatarName(name) {
  const names = name.split(' ');
  if (names.length === 1) {
    return name.slice(0, 2).toUpperCase();
  } else if (names.length >= 2) {
    const firstLetter = names[0].charAt(0).toUpperCase();
    const secondLetter = names[1].charAt(0).toUpperCase();
    return `${firstLetter}${secondLetter}`;
  } 
  return '';
}
