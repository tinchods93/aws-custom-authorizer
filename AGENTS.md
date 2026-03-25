# ROL Y ALCANCE

Agente aws-custom-authorizer. Este servicio es el guardian de entrada a toda la infraestructura de API Gateway de Formularia. Su unica responsabilidad es actuar como AWS Lambda Authorizer (TOKEN/REQUEST type): recibe cada solicitud entrante antes de que llegue a cualquier microservicio, valida el JWT de Auth0 usando JWKS, y devuelve una IAM policy document que permite o deniega la ejecucion de la funcion de destino. No contiene logica de negocio ni acceso a datos propios.

El servicio tambien gestiona de forma explicita los CORS preflight: las solicitudes OPTIONS son reconocidas por su `methodArn` y autorizadas automaticamente sin pasar por validacion de token, devolviendo un contexto con `bypassAuth: 'true'`. Para las solicitudes autenticadas, el resultado de la validacion se comunica al Lambda downstream a través del campo `context` del policy document. Si el token es invalido o ausente, el authorizer lanza `new Error('Unauthorized')`, lo que hace que API Gateway responda con HTTP 401 sin invocar el Lambda de destino.

# ARQUITECTURA LOCAL Y PATRONES

El repositorio sigue una **Arquitectura en Capas simplificada** (sin hexagonal formal ni DI container activo en runtime):

```
src/
  handlers/          <- Puerto primario: punto de entrada Lambda (authorizer.ts)
  domain/            <- Logica de orquestacion del flujo de autorizacion (authorizerDomain.ts)
  services/          <- Clientes de servicios externos (invokeValidateScopes.ts — invoca Lambda via rebased)
  utils/             <- Utilidades puras y configuracion
    validateToken.ts       <- Validacion JWT con jwks-rsa + jsonwebtoken
    validateScopes.ts      <- Parseo de methodArn y dispatch a validateScopes Lambda
    corsHelper.ts          <- Deteccion de OPTIONS y extraccion de HTTP method desde methodArn
    matchPaths.ts          <- Matching de rutas con soporte wildcard (*)
    configs/
      policyTemplate.ts    <- Construccion del IAM policy document (ALLOW/DENY)
  enums/             <- HttpMethodsEnum, PolicyEffectEnum
```

Flujo de autorizacion:
1. `handlers/authorizer.ts` recibe el evento y delega a `authorizerDomain`.
2. `authorizerDomain` detecta OPTIONS → ALLOW sin token; caso contrario extrae el Bearer token.
3. `validateToken` decodifica el JWT, obtiene la signing key del JWKS endpoint de Auth0 (`JWKS_URI`), y verifica la firma con `jsonwebtoken`.
4. `PolicyTemplate` construye el IAM policy document con el resource ARN del endpoint solicitado, generalizando el metodo HTTP para soportar CORS (`/*/`).

Librerias principales:
- `jsonwebtoken` — verificacion de firma JWT
- `jwks-rsa` — obtencion de claves publicas desde el JWKS endpoint de Auth0 (con cache y rate limiting)
- `rebased` — invocacion de Lambdas downstream (usado en `invokeValidateScopes` via `rebased/service/downstream/lambda`)
- `serverless-webpack` + `ts-loader` — bundling para despliegue en Lambda
- `serverless-iam-roles-per-function` — IAM por funcion (la unica IAM de este servicio es `lambda:InvokeFunction` sobre el Lambda `validateScope`)

Variables de entorno requeridas:
- `JWKS_URI` — endpoint JWKS de Auth0
- `AUDIENCE` — audience del token Auth0
- `TOKEN_ISSUER` — issuer del token Auth0
- `VALIDATE_SCOPE_FUNCTION_NAME` — nombre del Lambda externo que valida scopes

# REGLAS ESTRICTAS DE DESARROLLO

- **Estilo de Codigo:** TypeScript estricto. Todos los imports deben usar rutas relativas explicitas. Los enums se centralizan en `src/enums/`. No se usan `any` salvo en el parametro `event` del handler donde AWS no provee tipado oficial. ESLint con configuracion airbnb-base + prettier; el pre-commit hook ejecuta `npm run lint` automaticamente. No agregar logica de negocio fuera de `domain/`; las utilidades en `utils/` deben ser funciones puras sin efectos secundarios.

- **Manejo de Errores:** El authorizer solo puede terminar de dos formas validas: devolver un policy document (ALLOW o DENY) o lanzar `new Error('Unauthorized')`. Cualquier excepcion que no sea Unauthorized debe ser capturada, logueada con `console.error` usando el prefijo `MARTIN_LOG=>` para facilitar el filtrado en CloudWatch, y luego relanzada como `new Error('Unauthorized')`. Nunca devolver una respuesta HTTP estructurada — API Gateway interpreta cualquier throw distinto de Unauthorized como error 500 interno.

- **Testing:** Ejecutar con `npm run test` (Jest + ts-jest). Los tests viven en `tests/domain/` y `tests/utils/`. Antes de dar una tarea por terminada, toda rama de codigo nueva debe tener al menos un test unitario que cubra el happy path y el caso de fallo. Las dependencias externas (`validateToken`, servicios rebased) se mockean con `jest.mock`. Para correr un test especifico: `npx jest tests/domain/authorizerDomain.cors.test.ts --setupFiles dotenv/config --verbose`. No hay tests de integracion contra Auth0 real; se mockea el resultado de `validateToken`.

- **Dependencias Externas:** Todo acceso a otros Lambdas de AWS (actualmente solo el Lambda `validateScope`) DEBE realizarse a traves de `rebased/service/downstream/lambda` (invoke). No usar `@aws-sdk/client-lambda` directamente. La libreria `rebased` es el unico punto de entrada a recursos AWS desde este servicio. El acceso al JWKS endpoint de Auth0 se hace directamente con `jwks-rsa` (es una llamada HTTP externa, no un recurso AWS). El IAM de la funcion solo autoriza `lambda:InvokeFunction` sobre el ARN del Lambda `validateScope`; no agregar permisos adicionales sin justificacion.
