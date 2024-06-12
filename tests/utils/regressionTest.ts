import outputTestResponse from './outputTestResponse';
import compareJsons from './compareJsons';

const regressionTest = (expected, target, testName) => {
  const compare = compareJsons({
    expected,
    target,
  });

  outputTestResponse({
    testName: `${testName}`,
    payload: compare,
    testType: 'COMPARE',
  });

  expect(compare.missingData?.length).toBe(0);
  console.debug(`Regression Test - ${testName} --> OK`);
};

export default regressionTest;
