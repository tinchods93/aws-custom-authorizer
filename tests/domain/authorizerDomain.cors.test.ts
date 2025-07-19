import { PolicyEffectEnum } from '../../src/enums/policyEffectEnum';
import validateToken from '../../src/utils/validateToken';
import authorizerDomain from '../../src/domain/authorizerDomain';
import {
  isOptionsRequest,
  extractHttpMethod,
} from '../../src/utils/corsHelper';

// Mock validateToken module
jest.mock('../../src/utils/validateToken', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockValidateToken = validateToken as jest.MockedFunction<
  typeof validateToken
>;

describe('Authorizer Domain - CORS Tests', () => {
  const mockCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    // Set default mock behavior
    mockValidateToken.mockResolvedValue({
      principalId: 'test-user',
      policyDocument: {},
      context: { scope: 'read:users' },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CORS Helper Functions', () => {
    it('should detect OPTIONS requests correctly', () => {
      const optionsArn =
        'arn:aws:execute-api:us-east-1:123456789012:1234567890/test/OPTIONS/users';
      const getArn =
        'arn:aws:execute-api:us-east-1:123456789012:1234567890/test/GET/users';

      expect(isOptionsRequest(optionsArn)).toBe(true);
      expect(isOptionsRequest(getArn)).toBe(false);
    });

    it('should extract HTTP method correctly', () => {
      const optionsArn =
        'arn:aws:execute-api:us-east-1:123456789012:1234567890/test/OPTIONS/users';
      const getArn =
        'arn:aws:execute-api:us-east-1:123456789012:1234567890/test/GET/users';

      expect(extractHttpMethod(optionsArn)).toBe('OPTIONS');
      expect(extractHttpMethod(getArn)).toBe('GET');
    });
  });

  describe('OPTIONS (CORS Preflight) Requests', () => {
    it('should allow OPTIONS requests without token validation', async () => {
      const event = {
        methodArn:
          'arn:aws:execute-api:us-east-1:123456789012:1234567890/test/OPTIONS/users',
        headers: {
          Origin: 'http://localhost:3000',
        },
      };

      const result = await authorizerDomain(event, mockCallback);

      expect(result).toBeDefined();
      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe(
        PolicyEffectEnum.ALLOW
      );
      expect(result.context).toEqual({
        corsRequest: 'true',
        method: 'OPTIONS',
        bypassAuth: 'true',
      });
      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockValidateToken).not.toHaveBeenCalled();
    });
  });
});
