import { PolicyEffectEnum } from '../../enums/policyEffectEnum';

export default class PolicyTemplate {
  private resource: string;

  constructor(resource: string) {
    this.resource = resource;
  }

  getPolicy(effect: PolicyEffectEnum, context?: Record<string, string>) {
    // Create a more permissive resource pattern to allow all HTTP methods
    // This helps with CORS by allowing both the actual request and OPTIONS
    const baseResource = this.resource.replace(/\/([A-Z]+)\//, '/*/');

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

    // Add context if provided
    if (context) {
      policy.context = context;
    }

    return policy;
  }
}
