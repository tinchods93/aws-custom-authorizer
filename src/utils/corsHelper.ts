/**
 * Helper functions for handling CORS in custom authorizer
 */

/**
 * Check if the request is a CORS preflight request (OPTIONS)
 * @param methodArn - The method ARN from the event
 * @returns boolean indicating if it's an OPTIONS request
 */
export function isOptionsRequest(methodArn: string): boolean {
  return Boolean(methodArn && methodArn.includes('/OPTIONS/'));
}

/**
 * Check if the request is coming from a web browser (likely needs CORS)
 * @param headers - Request headers
 * @returns boolean indicating if it's a browser request
 */
export function isBrowserRequest(
  headers: Record<string, string> = {}
): boolean {
  const userAgent = headers['User-Agent'] || headers['user-agent'] || '';
  const origin = headers.Origin || headers.origin;

  return Boolean(origin || userAgent.includes('Mozilla'));
}

/**
 * Extract HTTP method from method ARN
 * @param methodArn - The method ARN from the event
 * @returns The HTTP method (GET, POST, etc.)
 */
export function extractHttpMethod(methodArn: string): string {
  const match = methodArn.match(/\/([A-Z]+)\//);
  return match ? match[1] : 'UNKNOWN';
}

/**
 * Extract resource path from method ARN
 * @param methodArn - The method ARN from the event
 * @returns The resource path
 */
export function extractResourcePath(methodArn: string): string {
  const parts = methodArn.split('/');
  return parts.length > 1 ? `/${parts.slice(1).join('/')}` : '/';
}
