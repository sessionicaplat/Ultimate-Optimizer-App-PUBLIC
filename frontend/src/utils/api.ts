const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithAuth(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  // Try to get instance token from URL first (initial load)
  const params = new URLSearchParams(window.location.search);
  let instanceToken = params.get('instance');

  // If not in URL, get from sessionStorage (for internal navigation)
  if (!instanceToken) {
    instanceToken = sessionStorage.getItem('wix_instance_token');
  }

  if (!instanceToken) {
    // Debug logging to help identify the issue
    console.error('❌ Instance token missing!');
    console.error('Current URL:', window.location.href);
    console.error('Query params:', window.location.search);
    console.error('Session storage:', sessionStorage.getItem('wix_instance_token'));
    console.error('\n📋 This usually means:');
    console.error('1. You accessed the app directly (not through Wix dashboard)');
    console.error('2. Session storage was cleared');
    console.error('3. The app needs to be reopened from the Wix dashboard\n');
    
    throw new ApiError(
      'Missing instance token. Please access this app from your Wix dashboard.',
      401
    );
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'X-Wix-Instance': instanceToken,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      if (response.status === 401) {
        throw new ApiError(
          'Authentication failed. Please refresh the page or reinstall the app.',
          401,
          errorData
        );
      }

      throw new ApiError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}
