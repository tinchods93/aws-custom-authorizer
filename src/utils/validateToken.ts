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
  if (!token || !methodArn) {
    return false;
  }

  const client = jwksClient({
    jwksUri: process.env.JWKS_URI as string,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  const decodedToken = decodeToken(token);

  const getSigningKey = util.promisify(client.getSigningKey);
  const jwtOptions = {}; // Ajusta según tus necesidades

  try {
    const key = await getSigningKey(decodedToken.header.kid);
    if (!key) {
      throw new Error('Signing key not found');
    }
    // Verifica el token usando la clave pública
    const signingKey = key?.getPublicKey();

    if (!signingKey) {
      throw new Error('Public key not found');
    }

    const decoded = jwt.verify(token, signingKey, jwtOptions) as any;
    return decoded && true;
  } catch (err) {
    return false;
  }
}
