import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import util from 'util';

// Esta función decodifica el token
function decodeToken(token: string) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('invalid token');
  }

  return decoded;
}

// Esta función valida los scopes de un token
export default async function validateToken(
  token: string,
  methodArn: string
): Promise<
  | {
      principalId: string;
      policyDocument: object;
      context: { scope: string };
    }
  | false
> {
  console.log('MARTIN_LOG=> Validating token :', token);
  console.log('MARTIN_LOG=> Method ARN :', methodArn);
  if (!token || !methodArn) {
    console.error('MARTIN_LOG=> Token or methodArn is missing');
    return false;
  }

  const client = jwksClient({
    jwksUri: process.env.JWKS_URI as string,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  if (!client) {
    console.error('MARTIN_LOG=> JWKS client not initialized');
    return false;
  }
  console.log('MARTIN_LOG=> JWKS client initialized');

  const decodedToken = decodeToken(token);

  if (!decodedToken) {
    console.error('MARTIN_LOG=> Token decoding failed');
    return false;
  }
  console.log('MARTIN_LOG=> Token decoded successfully');
  const getSigningKey = util.promisify(client.getSigningKey);
  if (!getSigningKey) {
    console.error('MARTIN_LOG=> getSigningKey function not available');
    return false;
  }
  console.log('MARTIN_LOG=> getSigningKey function available');
  const jwtOptions = {}; // Ajusta según tus necesidades

  try {
    const key = await getSigningKey(decodedToken.header.kid);

    if (!key) {
      console.error(
        'MARTIN_LOG=> Signing key not found for kid:',
        decodedToken.header.kid
      );
      throw new Error('Signing key not found');
    }
    console.log(
      'MARTIN_LOG=> Signing key found for kid:',
      decodedToken.header.kid
    );
    // Verifica el token usando la clave pública
    const signingKey = key?.getPublicKey();
    console.log('MARTIN_LOG=> Signing key retrieved successfully');

    if (!signingKey) {
      console.error('MARTIN_LOG=> Public key not found for signing key');
      throw new Error('Public key not found');
    }

    const decoded = jwt.verify(token, signingKey, jwtOptions) as any;
    console.log('MARTIN_LOG=> Token verified successfully');
    return decoded && true;
  } catch (err) {
    console.error('MARTIN_LOG=> Token verification failed:', err);
    return false;
  }
}
