import { PolicyEffectEnum } from '../../enums/policyEffectEnum';

export default class PolicyTemplate {
  private resource: string;

  constructor(resource: string) {
    this.resource = resource;
  }

  getPolicy(effect: PolicyEffectEnum, context?: Record<string, string>) {
    console.log('MARTIN_LOG=> Generating policy for resource:', this.resource);
    console.log('MARTIN_LOG=> Effect:', effect);
    console.log('MARTIN_LOG=> Context:', context);
    // Create a more permissive resource pattern to allow all HTTP methods
    // This helps with CORS by allowing both the actual request and OPTIONS
    const baseResource = this.resource.replace(/\/([A-Z]+)\//, '/*/');
    console.log('MARTIN_LOG=> Base resource:', baseResource);

    const policy: any = {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource:
              baseResource !== this.resource
                ? [this.resource, baseResource]
                : this.resource,
          },
        ],
      },
    };
    console.log('MARTIN_LOG=> Policy generated:', policy);

    // Add context if provided
    if (context) {
      console.log('MARTIN_LOG=> Adding context to policy:', context);
      policy.context = context;
    }
    console.log('MARTIN_LOG=> Final policy:', policy);

    return policy;
  }
}
