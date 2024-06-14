import { invoke } from 'rebased/service/downstream/lambda';
import { HttpMethodsEnum } from '../enums/httpMethodsEnum';

const invokeValidateScopes = async (
  scopesList: string,
  endpoint: string,
  endpointMethod: HttpMethodsEnum
) => {
  const responsePayload = await invoke(
    {
      FunctionName: process.env.VALIDATE_SCOPE_FUNCTION_NAME,
      Payload: {
        scopesList,
        endpoint,
        endpointMethod,
      },
    },
    {}
  ).catch((e) => {
    console.log('MARTIN_LOG=> invoke error', e);
    return false;
  });

  return responsePayload?.scopesIs || false;
};

export default invokeValidateScopes;
