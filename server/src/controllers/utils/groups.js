function getAncestorPaths(path) {
  /*
    Given a path like '/group1/group2/group3/',
    return an array of ancestor paths like ['/group1/', '/group1/group2/']
  */
  // Remove leading and trailing slashes, then split
  const segments = path.replace(/^\/|\/$/g, '').split('/');

  // Build paths excluding the last segment
  return segments.slice(0, -1).map((_, index) => {
    // Reconstruct path, adding leading and trailing slash
    return '/' + segments.slice(0, index + 1).join('/') + '/';
  });
}

export { getAncestorPaths };
