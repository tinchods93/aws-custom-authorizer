# CORS Configuration Guide for Custom Authorizer

Este custom authorizer ha sido modificado para manejar correctamente las peticiones CORS. Aquí están las consideraciones importantes:

## Cambios Realizados

### 1. Manejo de Peticiones OPTIONS
- El authorizer ahora detecta automáticamente peticiones OPTIONS (preflight CORS)
- Las peticiones OPTIONS se permiten sin validación de token
- Se incluye contexto específico para identificar peticiones CORS

### 2. Políticas de Recursos Mejoradas
- El authorizer ahora genera políticas que permiten múltiples métodos HTTP
- Esto evita que las peticiones subsecuentes fallen por falta de permisos

### 3. Contexto Enriquecido
- Se pasa contexto adicional a través del authorizer response
- Esto incluye información sobre el método HTTP y si es una petición CORS

## Configuración en los Endpoints

Para que tus endpoints funcionen correctamente con CORS, asegúrate de que tengan la configuración siguiente en tu `serverless.yml`:

```yaml
functions:
  myFunction:
    handler: src/handlers/myFunction.handler
    events:
      - http:
          path: /my-endpoint
          method: get
          authorizer:
            name: authorizer
            resultTtlInSeconds: 300
          cors:
            origin: '*'
            headers:
              - Content-Type
              - X-Amz-Date
              - Authorization
              - X-Api-Key
              - X-Amz-Security-Token
              - X-Amz-User-Agent
            allowCredentials: false
      - http:
          path: /my-endpoint
          method: options
          authorizer:
            name: authorizer
            resultTtlInSeconds: 300
          cors:
            origin: '*'
            headers:
              - Content-Type
              - X-Amz-Date
              - Authorization
              - X-Api-Key
              - X-Amz-Security-Token
              - X-Amz-User-Agent
            allowCredentials: false
```

## Configuración Alternativa (Más Automática)

También puedes usar esta configuración más simple:

```yaml
functions:
  myFunction:
    handler: src/handlers/myFunction.handler
    events:
      - http:
          path: /my-endpoint
          method: any
          authorizer:
            name: authorizer
            resultTtlInSeconds: 300
          cors: true
```

## Headers de Respuesta en tus Funciones

Asegúrate de que tus funciones Lambda incluyan los headers CORS correctos en sus respuestas:

```javascript
export const handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'Success' })
  };
  
  return response;
};
```

## Debugging

Si sigues teniendo problemas con CORS:

1. Verifica que las peticiones OPTIONS lleguen al authorizer
2. Revisa los logs de CloudWatch para ver si hay errores
3. Confirma que el authorizer esté retornando políticas para ambos métodos (el original y OPTIONS)
4. Asegúrate de que los headers CORS estén presentes en las respuestas de tus funciones

## Configuración de TTL

El `resultTtlInSeconds: 300` en la configuración del authorizer hace que las políticas de autorización se cacheen por 5 minutos. Esto mejora el performance pero puede causar problemas durante desarrollo. Para desarrollo, considera usar un valor menor como `resultTtlInSeconds: 0` para deshabilitar el cache.
