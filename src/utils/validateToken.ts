/* eslint-disable @typescript-eslint/no-unused-vars */
import moment from 'moment-timezone';
import jwt from 'jsonwebtoken';
import validateScopes from './validateScopes';

// Esta función decodifica el token
function decodeToken(token: string) {
  try {
    const currentTime = moment().tz('America/Argentina/Buenos_Aires').unix(); // UTC-3 timezone
    return jwt.verify(token, process.env.JWT_SECRET as string, {
      clockTimestamp: currentTime,
    }) as {
      client: { scopes: string };
    };
  } catch (error) {
    console.log('MARTIN_LOG=> error', JSON.stringify(error));
    throw new Error('Error al decodificar el token');
  }
}

// Esta función valida los scopes de un token
export default async function validateToken(
  token: string,
  methodArn: string
): Promise<boolean> {
  // Si el token no es proporcionado, retorna falso
  if (!token || !methodArn) {
    return false;
  }

  // Decodifica el token para obtener su payload
  const decodedToken = decodeToken(token);

  // Verifica si los scopes del token incluyen los scopes requeridos, y retorna el resultado
  const response = await validateScopes(
    decodedToken?.client?.scopes,
    methodArn
  );
  return response;
}
