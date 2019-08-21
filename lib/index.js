module.exports = {
  /**
   * Check that client is on minimum supported node version located.
   * @param {String} currentVersion The current node version as returned by node, e.g. v10.15.1.
   * @param {String} minVersion The minimum node version supported (engines.node)
   * @returns {boolean|*} Whether or not client node version is greater than minVersion.
   */
  checkVersion: (currentVersion, minVersion) => {
    const minimumVersionArr = minVersion.split('.').map(Number);
    const currentVersionArr = currentVersion.slice(1).split('.').map(Number);

    // Recursive function to check all semver values.
    const checkSemverRecursive = (target) => {
      const minNext = minimumVersionArr.shift();
      const targetNext = target.shift();

      if (targetNext > minNext) return true;
      if (targetNext < minNext) return false;

      // equal, need to recurse.
      if (target.length > 0) {
        return checkSemverRecursive(target, minimumVersionArr);
      }

      // Patch.
      return targetNext >= minNext;
    };

    return checkSemverRecursive(currentVersionArr, minimumVersionArr);
  },
};
