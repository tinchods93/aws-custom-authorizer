import { PolicyEffectEnum } from '../enums/policyEffectEnum';
import PolicyTemplate from '../utils/configs/policyTemplate';
import validateToken from '../utils/validateToken';
import { isOptionsRequest, extractHttpMethod } from '../utils/corsHelper';

async function authorizerDomain(event, callback) {
  const resource = event.methodArn;
  const Policy = new PolicyTemplate(resource);

  try {
    // Check if this is an OPTIONS request (CORS preflight)
    if (isOptionsRequest(event.methodArn)) {
      const httpMethod = extractHttpMethod(event.methodArn);
      return Policy.getPolicy(PolicyEffectEnum.ALLOW, {
        corsRequest: 'true',
        method: httpMethod,
        bypassAuth: 'true',
      });
    }

    //retrieve the token from the event
    let token = event.authorizationToken || event.headers?.Authorization;
    if (!token?.includes('Bearer ')) {
      callback('Unauthorized');
      console.error('MARTIN_LOG=> Unauthorized: Invalid token format');
      return Policy.getPolicy(PolicyEffectEnum.DENY);
    }
    token = token.replace('Bearer ', '').trim();

    //now you could do some things like
    // 1. call an OAuth provider
    // 2. lookup this token in your database (if you self manage tokens)
    // 3. decode the JWT token and do some verifications

    // get the resource
    const tokenValidationResult = await validateToken(token, event.methodArn);

    if (!tokenValidationResult) {
      callback('Unauthorized');
      console.error('MARTIN_LOG=> Unauthorized: Token validation failed');
      return Policy.getPolicy(PolicyEffectEnum.DENY);
    }

    // return the response with context
    const httpMethod = extractHttpMethod(event.methodArn);
    return Policy.getPolicy(PolicyEffectEnum.ALLOW, {
      tokenValidated: 'true',
      userId: 'authenticated-user',
      method: httpMethod,
      corsEnabled: 'true',
    });
  } catch (error) {
    console.error('Authorization error:', error);
    callback('Unauthorized');
    return Policy.getPolicy(PolicyEffectEnum.DENY);
  }
}

export default authorizerDomain;
