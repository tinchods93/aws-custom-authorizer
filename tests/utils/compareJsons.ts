import eachDeep from 'deepdash/eachDeep';
import lodash from 'lodash';

interface InputParamsInterface {
  expected: any;
  target: any;
}
interface OutputPayloadInterface {
  output: any;
  missingData?: string[];
  differentTypeData?: string[];
  newData?: string[];
}
enum resultsEnum {
  'missing' = 'missing',
  'same' = 'same',
  'different_type' = 'different_type',
}

/**
 * Compares two JSON objects and returns an object containing the comparison result,
 * paths of missing data, paths of data with different types, and paths of new data.
 *
 * @param {Iinput} { expected, target } - The expected and target JSON objects.
 * @returns {iOutput} - The result of the comparison.
 */
function compareJsons({
  expected,
  target,
}: InputParamsInterface): OutputPayloadInterface {
  // Initialize output object and arrays for missing, different type and new data
  const output: any = {};
  const missingData: any = [];
  const differentTypeData: any = [];
  const newData: any = [];

  // Iterate over each property in the expected JSON
  eachDeep(expected, (value, key, parentValue, parentKey) => {
    // If the value is not an object or array
    if (typeof value !== 'object' || !Array.isArray(value)) {
      // Initialize result as missing
      let result: resultsEnum = resultsEnum.missing;
      // Get the corresponding value from the target JSON
      const expectedValue = lodash.get(target, parentKey._item.strPath);
      // If the value exists in the target JSON
      if (expectedValue !== undefined) {
        // If the type of the value in the target JSON matches the expected type
        if (typeof expectedValue === typeof value) {
          result = resultsEnum.same;
        } else {
          // If the type of the value in the target JSON is different
          result = resultsEnum.different_type;
        }
      }
      // If the path exists
      if (parentKey._item.strPath) {
        // Depending on the result, add the path to the corresponding array
        switch (result) {
          case resultsEnum.missing:
            missingData.push(parentKey._item.strPath);
            break;
          case resultsEnum.different_type:
            differentTypeData.push(parentKey._item.strPath);
            break;
          default:
            break;
        }
      }

      // Set the result in the output object at the corresponding path
      lodash.set(output, parentKey._item.strPath, result);
    }
  });

  // Iterate over each property in the target JSON
  eachDeep(target, (value, key, parentValue, parentKey) => {
    // Get the corresponding value from the expected JSON
    const expectedValue = lodash.get(expected, parentKey._item.strPath);
    // If the value does not exist in the expected JSON, add the path to the new data array
    if (expectedValue === undefined) {
      newData.push(parentKey._item.strPath);
    }
  });

  // Remove the undefined property from the output object
  delete output.undefined;
  // Return the output object and the arrays for missing, different type and new data
  return { output, missingData, differentTypeData, newData };
}

export default compareJsons;
