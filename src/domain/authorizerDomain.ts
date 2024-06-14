import { PolicyEffectEnum } from '../enums/policyEffectEnum';
import PolicyTemplate from '../utils/configs/policyTemplate';
import validateToken from '../utils/validateToken';

async function authorizerDomain(event, callback) {
  const resource = event.methodArn;
  const Policy = new PolicyTemplate(resource);
  try {
    //retrieve the token from the event
    let token = event.authorizationToken || event.headers?.Authorization;

    if (!token?.includes('Bearer ')) callback('Unauthorized');
    token = token.replace('Bearer ', '').trim();

    //now you could do some things like
    // 1. call an OAuth provider
    // 2. lookup this token in your database (if you self manage tokens)
    // 3. decode the JWT token and do some verifications

    // get the resource
    const isValidToken = await validateToken(token, event.methodArn);

    if (!isValidToken) {
      callback('Unauthorized');
    }

    // return the response
    return Policy.getPolicy(PolicyEffectEnum.Allow);
  } catch (error) {
    callback('Unauthorized');
  }
  return Policy.getPolicy(PolicyEffectEnum.Deny);
}

export default authorizerDomain;
