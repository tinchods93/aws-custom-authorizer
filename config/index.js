const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return deepMerge(target, ...sources);
};

module.exports = async (sls) => {
  const { options, resolveVariable } = sls;
  // Load default configuration
  const defaultConfig = require('./default');
  // Check if stage configuration exists and load it
  const stage = await resolveVariable('sls:stage');
  const stageConfig = require(`./${stage}.js`);
  // Merge configuration, with stage configuration taking precedence
  const mergedConfig = deepMerge(defaultConfig, stageConfig);
  return mergedConfig || {};
};
