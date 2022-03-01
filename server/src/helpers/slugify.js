export default function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with _
    .replace(/[^\w_]+/g, '') // Remove all non-word chars
    .replace(/__+/g, '-') // Replace multiple _ with single -
    .replace(/^_+/, '') // Trim - from start of text
    .replace(/_+$/, ''); // Trim - from end of text
}
