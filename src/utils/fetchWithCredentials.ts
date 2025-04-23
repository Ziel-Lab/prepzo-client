/**
 * A wrapper around the native fetch function that automatically includes credentials.
 * This is necessary for sending session cookies to the backend.
 * 
 * @param input The URL to fetch or a Request object.
 * @param init Optional request initialization options (like method, headers, body).
 * @returns A Promise resolving to the Response object.
 */
export const fetchWithCredentials = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const options = {
    ...init,
    credentials: 'include' as RequestCredentials, // Ensure cookies (like session cookies) are sent
  };

  return fetch(input, options);
}; 