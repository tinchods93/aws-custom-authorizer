import { HttpMethodsEnum } from '../enums/httpMethodsEnum';
import invokeValidateScopes from '../services/invokeValidateScopes';

/**
 * Extracts the method and endpoint from a given methodArn.
 * @param {string} methodArn - The methodArn to extract information from.
 * @returns {Object} An object containing the method and endpoint.
 */
const getMethodAndEndpoint = (methodArn: string) => {
  const methodArnSplitted = methodArn.split(':').pop();
  if (!methodArnSplitted) {
    throw new Error('Invalid methodArn');
  }

  const [, , method, ...endpoint] = methodArnSplitted.split('/');
  const completeEndpoint = endpoint.join('/');

  return {
    method,
    endpoint: completeEndpoint,
  };
};

/**
 * Validates the scopes for a given methodArn.
 * @param {string} scopes - The scopes to validate.
 * @param methodArn - The methodArn to validate the scopes against.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the scopes are valid.
 */
async function validateScopes(
  scopes: string,
  methodArn: string
): Promise<boolean> {
  const { endpoint, method } = getMethodAndEndpoint(methodArn);

  const scopesValidationResult = (await invokeValidateScopes(
    scopes,
    endpoint,
    method as HttpMethodsEnum
  )) as boolean;

  return scopesValidationResult;
}

export default validateScopes;
