import authorizerDomain from '../domain/authorizerDomain';

export const handler = async (event: any, context: any, callback: any) => {
  return authorizerDomain(event, callback);
};
