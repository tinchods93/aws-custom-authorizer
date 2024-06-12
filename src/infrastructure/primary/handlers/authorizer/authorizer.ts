export const handler = async (event) => {
  console.log('MARTIN_LOG=> event', JSON.stringify(event));

  // by default we are denying everything
  let effect = 'Deny';

  //retrieve the token from the event
  const token = event.authorizationToken || event.headers.Authorization;

  //now you could do some things like
  // 1. call an OAuth provider
  // 2. lookup this token in your database (if you self manage tokens)
  // 3. decode the JWT token and do some additional verifications

  if (token === 'MySecretToken') {
    effect = 'Allow';
  }

  // get the resource
  const resource = event.methodArn;

  //construct a response which basically it will be a policy
  // const authResponse: any = {};
  // authResponse.principalId = 'user';
  // const policyDocument: any = {};
  // policyDocument.Version = '2012-10-17';
  // policyDocument.Statement = [];
  // const statement1: any = {};
  // statement1.Action = 'execute-api:Invoke';
  // statement1.Effect = effect;
  // statement1.Resource = resource;
  // policyDocument.Statement[0] = statement1;
  // authResponse.policyDocument = policyDocument;

  // you could add some additional context like for example a tenant
  // const context: any = {};
  // context.tenant = 'tenant1';
  // authResponse.context = context;
  const authResponse = {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
  console.log('MARTIN_LOG=>', JSON.stringify(authResponse));
  // return the response
  return authResponse;
};
