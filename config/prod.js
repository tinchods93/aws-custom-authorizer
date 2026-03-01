module.exports = {
  validateScopesFunctionArn:
    'arn:aws:lambda:us-east-1:921739153716:function:aws-token-security-prod-validateScope',
  token_providers: {
    auth0: {
      jwks_uri: `https://dev-hufol86imvvdceta.us.auth0.com/.well-known/jwks.json`,
      audience: `https://dev-hufol86imvvdceta.us.auth0.com/api/v2/`,
      issuer: `https://dev-hufol86imvvdceta.us.auth0.com`,
    },
  },
};
