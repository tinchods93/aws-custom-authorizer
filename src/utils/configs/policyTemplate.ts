import { PolicyEffectEnum } from '../../enums/policyEffectEnum';

export default class PolicyTemplate {
  private resource: string;

  constructor(resource: string) {
    this.resource = resource;
  }

  getPolicy(effect: PolicyEffectEnum) {
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: this.resource,
          },
        ],
      },
    };
  }
}
