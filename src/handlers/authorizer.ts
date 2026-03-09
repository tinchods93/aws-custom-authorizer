import authorizerDomain from '../domain/authorizerDomain';

export const handler = async (event: any, context: any) => {
  return authorizerDomain(event);
};
