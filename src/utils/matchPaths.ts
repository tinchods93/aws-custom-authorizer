/* eslint-disable no-continue */
function matchPaths(templatePath: string, actualPath: string): boolean {
  const templateSegments = templatePath.split('/');
  const actualSegments = actualPath.split('/');

  // Adjust the loop condition to handle prefix matching
  const minLength = Math.min(templateSegments.length, actualSegments.length);

  for (let i = 0; i < minLength; i++) {
    const templateSegment = templateSegments[i];
    const actualSegment = actualSegments[i];

    if (templateSegment === '*') {
      // If the segment in the template is "*", consider it a match
      continue;
    }

    if (templateSegment !== actualSegment) {
      // If the segments don't match and there's no "*", return false
      return false;
    }
  }

  // If we've checked all common segments, consider it a match
  return true;
}

export default matchPaths;
