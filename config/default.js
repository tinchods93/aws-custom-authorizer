const auth0domain = 'dev-hufol86imvvdceta.us.auth0.com';

module.exports = {
  validateScopesFunctionArn:
    'arn:aws:lambda:us-east-1:066342185209:function:aws-token-security-develop-validateScope',
  token_providers: {
    auth0: {
      jwks_uri: `https://${auth0domain}/.well-known/jwks.json`,
      audience: `https://${auth0domain}/api/v2/`,
      issuer: `https://${auth0domain}`,
    },
  },
};
