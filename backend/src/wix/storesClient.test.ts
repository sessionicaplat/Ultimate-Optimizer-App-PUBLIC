import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WixStoresClient } from './storesClient';
import * as appInstances from '../db/appInstances';

// Mock the database module
vi.mock('../db/appInstances', () => ({
  updateAccessToken: vi.fn(),
  updateCatalogVersion: vi.fn(),
  getAppInstance: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('WixStoresClient', () => {
  let client: WixStoresClient;
  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';
  const mockInstanceId = 'test-instance-id';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WIX_APP_ID = 'test-app-id';
    process.env.WIX_APP_SECRET = 'test-app-secret';
    client = new WixStoresClient(mockAccessToken, mockRefreshToken, mockInstanceId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: mockProducts,
          pagingMetadata: { cursors: { next: 'next-cursor' } },
        }),
      });

      const result = await client.getProducts();

      expect(result.products).toEqual(mockProducts);
      expect(result.nextCursor).toBe('next-cursor');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.wixapis.com/stores/v1/products/query',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: mockAccessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: {
              paging: {
                limit: 50,
              },
            },
          }),
        })
      );
    });

    it('should support cursor pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [], pagingMetadata: {} }),
      });

      await client.getProducts({ cursor: 'test-cursor' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            query: {
              paging: {
                limit: 50,
                cursor: 'test-cursor',
              },
            },
          }),
        })
      );
    });

    it('should support search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [], pagingMetadata: {} }),
      });

      await client.getProducts({ query: 'test search' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            query: {
              paging: {
                limit: 50,
              },
              filter: {
                name: {
                  $contains: 'test search',
                },
              },
            },
          }),
        })
      );
    });
  });

  describe('getCollections', () => {
    it('should fetch collections successfully', async () => {
      const mockCollections = [
        { id: '1', name: 'Collection 1' },
        { id: '2', name: 'Collection 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          collections: mockCollections,
          pagingMetadata: { cursors: { next: 'next-cursor' } },
        }),
      });

      const result = await client.getCollections();

      expect(result.collections).toEqual(mockCollections);
      expect(result.nextCursor).toBe('next-cursor');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.wixapis.com/stores/v1/collections/query',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product by ID', async () => {
      const mockProduct = { id: '123', name: 'Test Product' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const result = await client.getProduct('123');

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.wixapis.com/stores/v1/products/123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const mockUpdatedProduct = { id: '123', name: 'Updated Product' };
      const updates = { name: 'Updated Product' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockUpdatedProduct }),
      });

      const result = await client.updateProduct('123', updates);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.wixapis.com/stores/v1/products/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ product: updates }),
        })
      );
    });
  });

  describe('token refresh flow', () => {
    it('should refresh token on 401 and retry request', async () => {
      const mockProduct = { id: '123', name: 'Test Product' };
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      // Token refresh call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: 3600,
        }),
      });

      // Retry call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const result = await client.getProduct('123');

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Verify token refresh was called
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://www.wix.com/oauth/access',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: 'test-app-id',
            client_secret: 'test-app-secret',
            refresh_token: mockRefreshToken,
          }),
        })
      );

      // Verify database was updated
      expect(appInstances.updateAccessToken).toHaveBeenCalledWith(
        mockInstanceId,
        newAccessToken,
        newRefreshToken,
        3600
      );

      // Verify retry used new token
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: newAccessToken,
          }),
        })
      );
    });

    it('should throw error if token refresh fails', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      // Token refresh fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid refresh token',
      });

      await expect(client.getProduct('123')).rejects.toThrow(
        'Token refresh failed: Bad Request - Invalid refresh token'
      );
    });
  });

  describe('error handling', () => {
    it('should throw error on 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request body',
      });

      await expect(client.getProducts()).rejects.toThrow('Wix API error: Bad Request');
    });

    it('should throw error on 5xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(client.getProducts()).rejects.toThrow('Wix API error: Internal Server Error');
    });

    it('should include status code in error object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Product not found',
      });

      try {
        await client.getProduct('999');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(404);
        expect(error.body).toBe('Product not found');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getProducts()).rejects.toThrow('Network error');
    });
  });
});
