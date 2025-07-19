import authorizerDomain from '../domain/authorizerDomain';

export const handler = async (event: any, context: any, callback: any) => {
  console.log('MARTIN_LOG=> handler event:', JSON.stringify(event));
  return authorizerDomain(event, callback);
};
