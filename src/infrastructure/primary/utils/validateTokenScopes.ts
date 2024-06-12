import jwt from 'jsonwebtoken';

// Esta función decodifica el token
function decodeToken(token: string) {
  try {
    return jwt.decode(token) as { scopes: string };
  } catch (error) {
    throw new Error('Error al decodificar el token');
  }
}

// Esta función valida los scopes de un token
export default function validateTokenScopes(token: string): boolean {
  // Si el token no es proporcionado, retorna falso
  if (!token) {
    return false;
  }

  // Elimina cualquier espacio en blanco al inicio o al final del token, y quita el prefijo 'Bearer ' si existe
  token = token.trim().replace('Bearer ', '').trim();

  // Decodifica el token para obtener su payload
  const decodedToken = decodeToken(token);

  // Obtiene el primer grupo de Cognito del token decodificado
  const cognitoGroup = decodedToken['cognito:groups']?.[0] as string;

  // Si el grupo de Cognito no es proporcionado, retorna falso
  if (!cognitoGroup) {
    return false;
  }

  // Construye la clave de la variable de entorno para los scopes del grupo
  const envKey = `${cognitoGroup.toUpperCase()}_GROUP_SCOPES`;

  // Obtiene los scopes requeridos de las variables de entorno
  const requiredScopes = (process.env.REQUIRED_TOKEN_SCOPES as string).split(
    ' '
  );

  // Obtiene los scopes del token de las variables de entorno
  const tokenScopes = process.env[envKey] as string;

  // Verifica si los scopes del token incluyen los scopes requeridos, y retorna el resultado
  return requiredScopes.every((scope) => tokenScopes.includes(scope));
}
