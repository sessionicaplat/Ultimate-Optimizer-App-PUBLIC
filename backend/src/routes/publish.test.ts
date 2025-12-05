import { describe, it, expect } from 'vitest';

/**
 * Build Wix API update payload based on attribute type
 * This is a copy of the function from publish.ts for testing
 * Updated for 2025 Catalog V3 spec
 */
function buildProductUpdate(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      // Product name/title
      return { name: value };
    
    case 'description':
      // Product description - 2025 V3 uses plainDescription (HTML string)
      return {
        plainDescription: `<p>${value}</p>`,
      };
    
    case 'seoTitle':
      // SEO page title - 2025 V3 uses seoData.tags array
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
            },
          ],
        },
      };
    
    case 'seoDescription':
      // SEO meta description - 2025 V3 uses seoData.tags array
      return {
        seoData: {
          tags: [
            {
              type: 'meta',
              props: {
                name: 'description',
                content: value,
              },
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}

describe('buildProductUpdate', () => {
  it('should map name attribute to name field', () => {
    const result = buildProductUpdate('name', 'New Product Title');
    expect(result).toEqual({ name: 'New Product Title' });
  });

  it('should map description attribute to plainDescription field with HTML', () => {
    const result = buildProductUpdate('description', 'New product description');
    expect(result).toEqual({ plainDescription: '<p>New product description</p>' });
  });

  it('should map seoTitle attribute to seoData tags array with title type', () => {
    const result = buildProductUpdate('seoTitle', 'SEO optimized title');
    expect(result).toEqual({
      seoData: {
        tags: [
          {
            type: 'title',
            children: 'SEO optimized title',
          },
        ],
      },
    });
  });

  it('should map seoDescription attribute to seoData tags array with meta type', () => {
    const result = buildProductUpdate('seoDescription', 'SEO meta description');
    expect(result).toEqual({
      seoData: {
        tags: [
          {
            type: 'meta',
            props: {
              name: 'description',
              content: 'SEO meta description',
            },
          },
        ],
      },
    });
  });

  it('should throw error for unknown attribute type', () => {
    expect(() => buildProductUpdate('unknown', 'value')).toThrow('Unknown attribute type: unknown');
  });
});
