const validateError = (error, expected) => {
  expect(error.status).toStrictEqual(expected.status);
  expect(error.code).toStrictEqual(expected.code);
  expect(error.layer).toStrictEqual(expected.layer);
  expect(error.name).toStrictEqual(expected.name);
};
export default validateError;
