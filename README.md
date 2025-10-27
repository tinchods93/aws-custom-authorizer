# AWS Custom Authorizer

**Autorizador personalizado para AWS API Gateway** que maneja autenticación JWT con Auth0, validación de scopes y soporte completo para CORS.

## 🎯 **Propósito**

Este microservicio actúa como **punto central de autorización** para todos los microservicios de Formularia. Valida tokens JWT de Auth0, verifica scopes de permisos y genera políticas de acceso para AWS API Gateway, permitiendo que solo usuarios autenticados con los permisos correctos accedan a los endpoints protegidos.

## 🏗️ **Arquitectura**

```
Frontend (Next.js) → Auth0 → Custom Authorizer → Validate Scopes → Microservicios
                                          ↓
                                      API Gateway
```

### **Flujo de Autorización Completo:**

1. **Usuario autenticado** envía request con JWT token
2. **API Gateway** intercepta y llama al Custom Authorizer
3. **Authorizer** detecta si es request CORS (OPTIONS) y permite automáticamente
4. **Para requests normales**: valida el token JWT contra Auth0
5. **Si token válido**: invoca función de validación de scopes
6. **Si scopes válidos**: genera política ALLOW + contexto enriquecido
7. **Si inválido**: genera política DENY
8. **API Gateway** permite/bloquea el request basado en la política

## 🔧 **Funcionalidades**

### ✅ **Autenticación JWT Robusta**
- Validación de tokens Auth0 usando JWKS (JSON Web Key Set)
- Verificación de firma digital con cache de claves públicas
- Rate limiting para requests JWKS (10 req/min)
- Manejo de errores detallado con logging

### ✅ **Validación de Scopes Granular**
- Sistema de permisos basado en endpoints y métodos HTTP
- Invocación de función Lambda externa para validación
- Mapeo de scopes a recursos específicos
- Soporte para wildcards en paths (`*`)

### ✅ **Soporte CORS Avanzado**
- Detección automática de requests OPTIONS (preflight)
- Bypass de autenticación para requests CORS
- Políticas permisivas para múltiples métodos HTTP
- Contexto específico para requests CORS

### ✅ **Manejo de Errores y Logging**
- Logging detallado con prefijo `MARTIN_LOG=>`
- Fallback graceful en caso de errores
- Contexto enriquecido para funciones downstream
- Trazabilidad completa del flujo

## 📁 **Estructura del Proyecto**

```
src/
├── handlers/
│   └── authorizer.ts                    # Handler principal Lambda
├── domain/
│   └── authorizerDomain.ts             # Lógica de negocio central
├── utils/
│   ├── validateToken.ts                # Validación JWT con Auth0 JWKS
│   ├── validateScopes.ts               # Validación de permisos por endpoint
│   ├── corsHelper.ts                   # Utilidades para manejo CORS
│   ├── matchPaths.ts                   # Matching de paths con wildcards
│   └── configs/
│       └── policyTemplate.ts           # Generación de políticas IAM
├── services/
│   └── invokeValidateScopes.ts         # Invocación de función de scopes
├── enums/
│   ├── policyEffectEnum.ts             # ALLOW/DENY
│   └── httpMethodsEnum.ts              # Métodos HTTP soportados
├── authorizer.yml                      # Configuración Serverless
└── tests/
    ├── domain/
    │   └── authorizerDomain.cors.test.ts # Tests de funcionalidad CORS
    └── utils/                          # Tests de utilidades
```

## ⚙️ **Configuración**

### **Variables de Entorno:**

```bash
# Auth0 Configuration
AUDIENCE=https://dev-hufol86imvvdceta.us.auth0.com/api/v2/
TOKEN_ISSUER=https://dev-hufol86imvvdceta.us.auth0.com
JWKS_URI=https://dev-hufol86imvvdceta.us.auth0.com/.well-known/jwks.json

# External Functions (Scope Validation)
VALIDATE_SCOPE_FUNCTION_NAME=aws-token-security-develop-validateScope

# Service Info
SERVICE=aws-custom-authorizer
REGION=us-east-1
ACCOUNT_ID=123456789012
LOG_LEVEL=DEBUG
OWNER_PROJECT_NAME=Protoprime
```

### **Dependencias Principales:**

```json
{
  "jsonwebtoken": "^9.0.2",      // Validación JWT
  "jwks-rsa": "^3.2.0",         // Claves públicas Auth0 con cache
  "http-status-codes": "^2.3.0", // Códigos HTTP estándar
  "moment": "^2.30.1",           // Manejo de fechas
  "moment-timezone": "^0.5.45",  // Zonas horarias
  "rebased": "^1.1.0"            // Invocación de Lambdas
}
```

### **Configuración por Stage:**

```javascript
// config/default.js
module.exports = {
  validateScopesFunctionArn: 'arn:aws:lambda:us-east-1:066342185209:function:aws-token-security-develop-validateScope'
};

// config/develop.js - Override para desarrollo
module.exports = {};

// config/prod.js - Override para producción
module.exports = {
  // Configuraciones específicas de producción
};
```

## 🚀 **Deployment**

### **Desarrollo:**
```bash
npm run deploy-dev
```

### **Producción:**
```bash
npm run deploy-prod
```

### **Scripts Disponibles:**
```bash
npm run lint              # ESLint con reglas Airbnb
npm run lint-fix          # Auto-fix de problemas de linting
npm run test              # Jest tests unitarios
npm run test:integration  # Tests de integración
npm run package           # Empaquetar sin deploy
npm run remove-dev        # Eliminar stack de desarrollo
```

## 🔍 **Cómo Funciona**

### **1. Detección de Requests CORS:**

```typescript
// Detección automática de requests OPTIONS
if (isOptionsRequest(event.methodArn)) {
  console.log('CORS preflight request detected');
  return Policy.getPolicy(PolicyEffectEnum.ALLOW, {
    corsRequest: 'true',
    method: extractHttpMethod(event.methodArn),
    bypassAuth: 'true'
  });
}
```

### **2. Validación de Token JWT:**

```typescript
// Extracción y limpieza del token
let token = event.authorizationToken || event.headers?.Authorization;
if (!token?.includes('Bearer ')) {
  return Policy.getPolicy(PolicyEffectEnum.DENY);
}
token = token.replace('Bearer ', '').trim();

// Validación contra Auth0 JWKS
const tokenValidationResult = await validateToken(token, event.methodArn);
if (!tokenValidationResult) {
  return Policy.getPolicy(PolicyEffectEnum.DENY);
}
```

### **3. Validación de Scopes:**

```typescript
// Extracción de método y endpoint del ARN
const { endpoint, method } = getMethodAndEndpoint(methodArn);

// Invocación de función externa para validar scopes
const scopesValidationResult = await invokeValidateScopes(
  scopes,
  endpoint,
  method as HttpMethodsEnum
);
```

### **4. Generación de Políticas IAM:**

```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Allow",
      "Resource": [
        "arn:aws:execute-api:region:account:api/stage/GET/resource",
        "arn:aws:execute-api:region:account:api/stage/*/resource"
      ]
    }]
  },
  "context": {
    "tokenValidated": "true",
    "userId": "authenticated-user",
    "method": "GET",
    "corsEnabled": "true",
    "scope": "read:users"
  }
}
```

## 🔗 **Integración con Microservicios**

### **Configuración en serverless.yml:**

```yaml
functions:
  myFunction:
    handler: src/handlers/myFunction.handler
    events:
      - http:
          path: /my-endpoint
          method: get
          authorizer:
            type: CUSTOM
            authorizerId: { Ref: Authorizer }
          cors: true
```

### **Contexto Disponible en Funciones:**

```typescript
// En tu función Lambda
export const handler = async (event) => {
  const authorizer = event.requestContext.authorizer;
  
  const userId = authorizer.userId;
  const tokenValidated = authorizer.tokenValidated;
  const corsEnabled = authorizer.corsEnabled;
  const scope = authorizer.scope;
  const method = authorizer.method;
  
  // Tu lógica aquí...
};
```

## 🧪 **Testing**

### **Ejecutar Tests:**
```bash
npm test                    # Tests unitarios
npm run test:integration    # Tests de integración
```

### **Cobertura de Tests:**
- Tests de detección CORS
- Tests de extracción de métodos HTTP
- Tests de validación de tokens
- Tests de generación de políticas
- Tests de manejo de errores

### **Mocking:**
```typescript
// Ejemplo de test con mocks
jest.mock('../../src/utils/validateToken', () => ({
  __esModule: true,
  default: jest.fn(),
}));
```

## 📊 **Monitoreo y Observabilidad**

### **CloudWatch Logs:**
- **Prefijo**: `MARTIN_LOG=>` para fácil filtrado
- **Niveles**: DEBUG, INFO, ERROR
- **Información**: Token validation, scope validation, CORS detection
- **Retención**: 14 días

### **Métricas Importantes:**
- Tiempo de validación de tokens
- Tasa de éxito/fallo de autorización
- Requests CORS vs normales
- Errores de validación de scopes
- Latencia de invocación de funciones externas

### **X-Ray Tracing:**
```yaml
# Habilitado en serverless.yml
tracing:
  lambda: true
```

## 🔧 **Troubleshooting**

### **Problemas Comunes:**

1. **"Unauthorized" Error:**
   ```bash
   # Verificar logs
   LOG_LEVEL=DEBUG npm run deploy-dev
   
   # Verificar configuración Auth0
   echo $JWKS_URI
   echo $TOKEN_ISSUER
   ```

2. **CORS Issues:**
   ```bash
   # Verificar detección de OPTIONS
   # Buscar en logs: "CORS preflight request detected"
   ```

3. **Scope Validation Failures:**
   ```bash
   # Verificar función externa
   echo $VALIDATE_SCOPE_FUNCTION_NAME
   
   # Verificar permisos IAM para invocar función
   ```

4. **Performance Issues:**
   ```bash
   # JWKS cache está habilitado por defecto
   # Rate limiting: 10 req/min
   # Provisioned Concurrency configurado para prod
   ```

### **Debug Mode:**
```bash
# Habilitar logs detallados
export LOG_LEVEL=DEBUG
npm run deploy-dev
```

## 🛠️ **Desarrollo Local**

### **Setup:**
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar tests
npm test

# Linting
npm run lint-fix
```

### **Testing Local:**
```bash
# Test unitario específico
npm test -- --testPathPattern=authorizerDomain.cors.test.ts

# Test con coverage
npm test -- --coverage
```

## 📈 **Roadmap y Mejoras Futuras**

### **Próximas Funcionalidades:**
- [ ] **Cache de políticas** para reducir latencia
- [ ] **Rate limiting** por usuario
- [ ] **Audit logging** completo
- [ ] **Métricas personalizadas** CloudWatch
- [ ] **Health checks** automáticos

### **Optimizaciones:**
- [ ] **Cold start optimization**
- [ ] **Memory tuning** basado en métricas
- [ ] **Provisioned concurrency** automático
- [ ] **Dead letter queues** para errores

## 📞 **Soporte y Contribución**

### **Contacto:**
- **Autor**: Martin dos Santos
- **Proyecto**: Protoprime
- **Issues**: GitHub Issues del repositorio

### **Contribuir:**
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

**Desarrollado con ❤️ para el ecosistema Formularia**

*Autorización segura, escalable y mantenible para microservicios serverless.*
