About the Wix Stores Catalog API
Wix Stores creates a catalog of store owners’ items for purchase and allows store owners to create smaller collections of products by type or theme. A catalog organizes the store’s products and collections and facilitates inventory management. With the Wix Stores Catalog API you can query individual products, collections or the entire catalog, as well as create products and add their media.

Querying the products and collections in the catalog enables you to coordinate a store’s inventory across other sales platforms (e.g., Facebook marketplace), or inventory management tools (e.g., NetSuite, TradeGecko), among other uses.

Catalog V3
Wix Stores is introducing Catalog V3, a new set of APIs for the Wix Stores product catalog, set to roll out in Q2 2025. The new catalog will initially be rolled out to new users only, and over time, Catalog V3 will fully replace Catalog V1.

This upgraded catalog will provide Wix Stores owners with enhanced tools to build more comprehensive product catalogs and streamline store management.

To remain compatible with all Wix Stores users, your app must be able to support both versions of the catalog:

Learn more about how to integrate with the Catalog V3 APIs.
Use the Catalog Versioning API to determine which version of the Wix Stores Catalog a site is using.
Terminology
The catalog is a complete list of all the store’s products.
Collections are themed groupings of items for purchase that a store owner can create to organize their products (e.g., Spring 2019, Running shoes, etc.). Products can belong to multiple collections.
Options are property types that customers can select within the specific product - e.g., color and size.
Choices are the available selections within each option - e.g., red and green choices under the Color option.
Variants are combinations of different product options and choices - e.g., a red shirt in size large. A variant can override the following values from the parent product:
Price
SKU
Weight
Inventory
Error handling
Status code	Description
200	Success
400	Invalid input (e.g., when the filter format is not valid or when providing invalid options when calling productOptionsAvailability)
401	Invalid authorization token, or Wix stores is not installed
404	Requested product or collection is not found
500	Unexpected error
Did this help?

Yes

No
Filter and sort
Query Language
Endpoints that allow querying follow these format guidelines.

Query Products
Fields That Allow Filtering
Field	Operators	Sorting Allowed
name	$eq,$ne,$hasSome,$contains,$startsWith	Allowed
description	$eq,$ne,$hasSome,$contains,$startsWith	
sku	$eq,$ne,$hasSome,$contains,$startsWith	Allowed
id	$eq,$ne,$hasSome	Allowed
price	$eq,$ne,$hasSome,$lt,$lte,$gt,$gte	Allowed
numericId	$eq,$ne,$hasSome,$lt,$lte,$gt,$gte	Allowed
productType	$eq,$ne,$hasSome	Allowed
slug	$eq,$ne,$hasSome,$contains,$startsWith	Allowed
collections.id	$eq,$ne,$hasSome,$hasAll	
options.\<option name\>	$eq,$ne,$hasSome,$hasAll	
inventoryStatus	$eq,$ne,$hasSome	
lastUpdated	$eq,$ne,$hasSome,$lt,$lte,$gt,$gte	Allowed
createdDate	$eq,$ne,$hasSome,$lt,$lte,$gt,$gte	Allowed
** Note that "hasSome" is same as the operator "IN" in SQL

Examples
Query products where price = 10

Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"filter":"{\"price\": \"10\"}"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Query products, order by price descending

Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"sort":"[{\"price\": \"desc\"}]"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Getting all products for a given collection

Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"filter":"{\"collections.id\": { \"$hasSome\": [\"your_collection_id_here\"]} }"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Getting multiple products by IDs

Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"filter":"{\"id\": {\"$hasSome\": [\"YOUR_PRODUCT_ID_HERE\", \"YOUR_PRODUCT_ID_HERE\"]}}"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Getting all products with a specific choice

Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"filter":"{\"productOptions.size\": \"L\"}}"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Getting all products in a store

Get the first page:
Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"sort":"[{\"numericId\": \"asc\"}]"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Take the numericId of the last returned item and run the following query:
Copy
curl 'https://www.wixapis.com/stores/v1/products/query' --data-binary '{"query":{"sort":"[{\"numericId\": \"asc\"}]","filter":"{\"numericId\": {\"$gt\": LAST_NUMERIC_ID}}"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Continue until no more records are returned.
Query Collections
Fields That Allow Filtering
Field	Operators	Sorting Allowed
name	$eq,$ne,$hasSome,$contains,$startsWith	Allowed
id	$eq,$ne,$hasSome,$contains,$startsWith	Allowed
** Note that "hasSome" is same as the operator "IN" in SQL

Examples
Query collections where name = my collection

Copy
curl 'https://www.wixapis.com/stores/v1/collections/query' --data-binary '{"query":{"filter":"{\"name\": \"my collection\"}}"}}' -H 'Content-Type: application/json' -H 'Authorization: XXX'
Did this help?

Yes

No
Use Cases
In this example we will query a product variant:

The product is a Shirt.
The Shirt has 2 options - Size and Color.
The size option has 3 choices - S/M/L.
The color option has 3 choices - Red/Green/Blue.
The product variant S+Red is out of stock.
Call Get Product to retrieve product options

Copy
curl -X GET \
    'https: //www.wixapis.com/stores/v1/products/91f7ac8b-2baa-289c-aa50-6d64764f35d3' \
    -H 'Authorization: <AUTH>'
Copy
{
  ...
  "productOptions": [
    {
      "optionType": "drop_down",
      "name": "Size",
      "choices": [
        {
          "value": "S",
          "description": "S",
          "inStock": true,
          "visible": true
        },
        {
          "value": "M",
          "description": "M",
          "inStock": true,
          "visible": true
        },
        {
          "value": "L",
          "description": "L",
          "inStock": true,
          "visible": true
        }
      ]
    },
    {
      "optionType": "color",
      "name": "Color",
      "choices": [
        {
          "value": "#FF0000",
          "description": "Red",
          "inStock": true,
          "visible": true
        },
        {
          "value": "#00FF00",
          "description": "Green",
          "inStock": true,
          "visible": true
        },
        {
          "value": "#00000FF",
          "description": "Blue",
          "inStock": true,
          "visible": true
        }
      ]
    }
  ]
}
Call Get Product Options Availability to retrieve the S size availability

Notice in the response that:

Red is out of stock because S+Red is out of stock.
availableForPurchase is false because both size and color must be given for this product.
Copy
curl -X POST \
    'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/productOptionsAvailability' \
    -d '{
          "options": {
            "size": "S"
          }
        }' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: <AUTH>'
Copy
{
  "productOptions": [
    {
      "optionType": "drop_down",
      "name": "Size",
      "choices": [
        {
          "value": "S",
          "description": "S",
          "inStock": true,
          "visible": true
        },
        {
          "value": "M",
          "description": "M",
          "inStock": true,
          "visible": true
        },
        {
          "value": "L",
          "description": "L",
          "inStock": true,
          "visible": true
        }
      ]
    },
    {
      "optionType": "color",
      "name": "Color",
      "choices": [
        {
          "value": "#FF0000",
          "description": "Red",
          "inStock": false,
          "visible": true
        },
        {
          "value": "#00FF00",
          "description": "Green",
          "inStock": true,
          "visible": true
        },
        {
          "value": "#00000FF",
          "description": "Blue",
          "inStock": true,
          "visible": true
        }
      ]
    }
  ],
  "availableForPurchase": false
}
Call Get Product Options Availability to retrieve the availability of S+Green

Notice in the response that:

We get the selected variant, with proper values for price, weight, SKU and inventory.
availableForPurchase is true.
Copy
curl -X POST \
    'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/productOptionsAvailability' \
    -d '{
          "options": {
            "size": "S",
            "color": "Green"
          }
        }' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: <AUTH>'
Copy
{
  "selectedVariant": {
    "price": {
      "currency": "USD",
      "price": 81,
      "discountedPrice": 81,
      "formatted": {
        "price": "$81.00",
        "discountedPrice": "$81.00"
      }
    },
    "weight": 0,
    "sku": "364215376135191",
    "inStock": true,
    "visible": true
  },
  "productOptions": [
    {
      "optionType": "drop_down",
      "name": "Size",
      "choices": [
        {
          "value": "S",
          "description": "S",
          "inStock": true,
          "visible": true
        },
        {
          "value": "M",
          "description": "M",
          "inStock": true,
          "visible": true
        },
        {
          "value": "L",
          "description": "L",
          "inStock": true,
          "visible": true
        }
      ]
    },
    {
      "optionType": "color",
      "name": "Color",
      "choices": [
        {
          "value": "#FF0000",
          "description": "Red",
          "inStock": false,
          "visible": true
        },
        {
          "value": "#00FF00",
          "description": "Green",
          "inStock": true,
          "visible": true
        },
        {
          "value": "#00000FF",
          "description": "Blue",
          "inStock": true,
          "visible": true
        }
      ]
    }
  ],
  "availableForPurchase": true
}
Did this help?

Yes

No
eCommerce Integration
Adding products from your Wix Stores catalog to an eCommerce cart, checkout, or order, must follow the structure of the catalogReference object.

Pass the catalogReference object as part of the lineItems array to eCommerce methods such as:

Add To Cart.
Create Checkout and Add To Checkout.
Create Order.
The catalogReference object includes the following fields:

catalogItemId - When passing Wix Stores products, this is the productId.
appId - The Wix Stores app ID. When using products from the Stores catalog, this must always be "215238eb-22a5-4c36-9e7b-e7c08025e04e".
options - This optional field can hold different key
pairs, depending on variant management and whether the product/variant has custom text fields.
The examples below detail about the 2 main uses of the catalogReference object when passing Wix Stores products.

Managed Variants
When a product's variants are managed (product.manageVariants: true), the catalogReference.options should hold the variant's variantId. In the following example, the variant also has customTextFields:

Copy
{
  "catalogReference": {
    "catalogItemId": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a",
    "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
    "options": {
      "variantId": "00000000-0000-0020-0005-ad9cdc10d3b8",
      "customTextFields": {
        "What would you like written on the custom label?": "Hope you enjoy the coffee! :)"
      }
    }
  }
}
Non-Managed Variants
When a product's variants are not managed (product.manageVariants: false), the options object should hold the variant's options and choices:

Copy
{
  "catalogReference": {
    "catalogItemId": "4d93fb7e-e612-612f-5c27-81b35b503ad7",
    "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
    "options": {
      "options": {
        "Size": "Medium",
        "Color": "Red"
      }
    }
  }
}
Did this help?

Yes

No
Product Object
Read and write products from Wix Stores Catalog

Properties
id
string
Read-only
Product ID (generated automatically by the catalog).

name
string
minLength 1
maxLength 80
Product name.

Min: 1 character Max: 80 characters

slug
string
maxLength 100
A friendly URL name (generated automatically by the catalog when a product is created), can be updated.

visible
boolean
Whether the product is visible to site visitors.

productType
string
Currently, only creating physical products ( "productType": "physical" ) is supported via the API.

Show Enum Values
description
string
maxLength 8000
Product description. Accepts rich text.

sku
string
maxLength 40
Stock keeping unit. If variant management is enabled, SKUs will be set per variant, and this field will be empty.

weight
number
minimum 0
maximum 999999999.99
format double
Product weight. If variant management is enabled, weight will be set per variant, and this field will be empty.

weightRange
WeightRange
Read-only
Product weight range. The minimum and maximum weights of all the variants.

Show Child Properties
stock
Stock
Read-only
Product inventory status (in future this will be writable via Inventory API).

Show Child Properties
price
Price
Read-only
deprecated
Deprecated (use priceData instead).

Show Child Properties
priceData
PriceData
Price data.

Show Child Properties
convertedPriceData
ConvertedPriceData
Read-only
Price data, converted to the currency specified in request header.

Show Child Properties
priceRange
PriceRange
Read-only
Product price range. The minimum and maximum prices of all the variants.

Show Child Properties
costAndProfitData
CostAndProfitData
Cost and profit data.

Show Child Properties
costRange
CostRange
Read-only
Product cost range. The minimum and maximum costs of all the variants.

Show Child Properties
pricePerUnitData
PricePerUnitData
Price per unit data.

Show Child Properties
additionalInfoSections
Array <AdditionalInfoSection>
Additional text that the store owner can assign to the product (e.g. shipping details, refund policy, etc.).

Show Child Properties
ribbons
Array <Ribbon>
Read-only
deprecated
Deprecated (use ribbon instead).

Show Child Properties
media
Media
Read-only
Media items (images, videos etc) associated with this product (writable via Add Product Media endpoint).

Show Child Properties
customTextFields
Array <CustomTextField>
Read-only
Text box for the customer to add a message to their order (e.g., customization request). Currently writable only from the UI.

Show Child Properties
manageVariants
boolean
Whether variants are being managed for this product - enables unique SKU, price and weight per variant. Also affects inventory data.

productOptions
Array <ProductOption>
maxItems 6
Options for this product.

Show Child Properties
productPageUrl
ProductPageUrl
Read-only
Product page URL for this product (generated automatically by the server).

Show Child Properties
numericId
number
Read-only
Product’s unique numeric ID (assigned in ascending order). Primarily used for sorting and filtering when crawling all products.

inventoryItemId
string
Read-only

Inventory item ID - ID referencing the inventory system.

discount
Discount
Discount deducted from the product's original price.

Show Child Properties
collectionIds
Array <string>
Read-only
A list of all collection IDs that this product is included in (writable via the Catalog > Collection APIs).

variants
Array <Variant>
Read-only
maxItems 1000
Product variants, will be provided if the request was sent with the includeVariants: true.

Max: 1,000 variants

Show Child Properties
lastUpdated
string
Read-only
format date-time
Date and time the product was last updated.

createdDate
string
Read-only
format date-time
Date and time the product was created.

seoData
SeoData
Custom SEO data for the product.

Show Child Properties
ribbon
string
maxLength 30
Product ribbon. Used to highlight relevant information about a product. For example, "Sale", "New Arrival", "Sold Out".

brand
string
minLength 1
maxLength 50
Product brand. Including a brand name can help improve site and product visibility on search engines.

Object Samples:
Product
JSON
{
  "product": {
    "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
    "name": "Colombian Arabica",
    "slug": "colombian-arabica-1",
    "visible": true,
    "productType": "physical",
    "description": "<p>The best organic coffee that Colombia has to offer.</p>",
    "stock": {
      "trackInventory": false,
      "inStock": true,
      "inventoryStatus": "IN_STOCK"
    },
    "weightRange": {
      "minValue": 0.25,
      "maxValue": 1
    },
    "price": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "priceData": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "convertedPriceData": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "priceRange": {
      "minValue": 35,
      "maxValue": 70
    },
    "costRange": {
      "minValue": 20,
      "maxValue": 40
    },
    "pricePerUnitData": {
      "totalQuantity": 250,
      "totalMeasurementUnit": "G",
      "baseQuantity": 1,
      "baseMeasurementUnit": "G"
    },
    "additionalInfoSections": [
      {
        "title": "Storage recommendations",
        "description": "<p>To&nbsp;preserve&nbsp;your beans' fresh roasted flavor as long as possible, store them in an opaque, air-tight container at room temperature.</p>\n"
      }
    ],
    "ribbons": [
      {
        "text": "Organic and Fair trade"
      }
    ],
    "media": {
      "mainMedia": {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "width": 6000,
          "height": 3376
        },
        "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg"
      },
      "items": [
        {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
            "width": 6000,
            "height": 3376
          },
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg"
        }
      ]
    },
    "customTextFields": [
      {
        "title": "What would you like us to print on the custom label?",
        "maxLength": 200,
        "mandatory": false
      }
    ],
    "manageVariants": true,
    "productOptions": [
      {
        "optionType": "drop_down",
        "name": "Weight",
        "choices": [
          {
            "value": "250g",
            "description": "250g",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          },
          {
            "value": "500g",
            "description": "500g",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          }
        ]
      },
      {
        "optionType": "drop_down",
        "name": "Ground for",
        "choices": [
          {
            "value": "Stovetop",
            "description": "Stovetop",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          },
          {
            "value": "Filter",
            "description": "Filter",
            "inStock": true,
            "visible": true
          }
        ]
      }
    ],
    "productPageUrl": {
      "base": "https://wixsite.com/examplestore",
      "path": "/product-page/colombian-arabica-1"
    },
    "numericId": "1586693639134000",
    "inventoryItemId": "6e085374-d455-d763-55af-929b89b0ca2c",
    "discount": {
      "type": "AMOUNT",
      "value": 5
    },
    "collectionIds": [
      "32fd0b3a-2d38-2235-7754-78a3f819274a",
      "00000000-000000-000000-000000000001"
    ],
    "variants": [
      {
        "id": "00000000-0000-0020-0005-a316e6ba5b37",
        "choices": {
          "Weight": "250g",
          "Ground for": "Stovetop"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "costAndProfitData": {
            "itemCost": 20,
            "formattedItemCost": "$20.00",
            "profit": 10,
            "formattedProfit": "$10.00",
            "profitMargin": 0.3333
          },
          "weight": 0.25,
          "sku": "10001",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-0021-0005-a316e6ba5b37",
        "choices": {
          "Weight": "250g",
          "Ground for": "Filter"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "costAndProfitData": {
            "itemCost": 20,
            "formattedItemCost": "$20.00",
            "profit": 10,
            "formattedProfit": "$10.00",
            "profitMargin": 0.3333
          },
          "weight": 0.25,
          "sku": "10003",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-003f-0005-a316e6ba5b37",
        "choices": {
          "Weight": "500g",
          "Ground for": "Stovetop"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 65,
            "discountedPrice": 60,
            "formatted": {
              "price": "$65.00",
              "discountedPrice": "$60.00",
              "pricePerUnit": "$0.24"
            },
            "pricePerUnit": 0.24
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 65,
            "discountedPrice": 60,
            "formatted": {
              "price": "$65.00",
              "discountedPrice": "$60.00",
              "pricePerUnit": "$0.24"
            },
            "pricePerUnit": 0.24
          },
          "costAndProfitData": {
            "itemCost": 40,
            "formattedItemCost": "$40.00",
            "profit": 20,
            "formattedProfit": "$20.00",
            "profitMargin": 0.3333
          },
          "weight": 0.5,
          "sku": "10002",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-0040-0005-a316e6ba5b37",
        "choices": {
          "Weight": "500g",
          "Ground for": "Filter"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 70,
            "discountedPrice": 65,
            "formatted": {
              "price": "$70.00",
              "discountedPrice": "$65.00",
              "pricePerUnit": "$0.26"
            },
            "pricePerUnit": 0.26
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 70,
            "discountedPrice": 65,
            "formatted": {
              "price": "$70.00",
              "discountedPrice": "$65.00",
              "pricePerUnit": "$0.26"
            },
            "pricePerUnit": 0.26
          },
          "costAndProfitData": {
            "itemCost": 40,
            "formattedItemCost": "$40.00",
            "profit": 25,
            "formattedProfit": "$25.00",
            "profitMargin": 0.3846
          },
          "weight": 1,
          "sku": "10004",
          "visible": true
        }
      }
    ],
    "lastUpdated": "2022-07-12T10:02:26.664Z",
    "createdDate": "2020-04-12T12:13:59.134Z",
    "seoData": {
      "tags": [
        {
          "type": "title",
          "children": "Colombian Arabica | Organic and Fair Trade",
          "custom": false,
          "disabled": false
        },
        {
          "type": "meta",
          "props": {
            "name": "description",
            "content": "The best organic fair trade coffee that Colombia has to offer."
          },
          "children": "",
          "custom": false,
          "disabled": false
        }
      ]
    },
    "ribbon": "Organic and Fair trade",
    "brand": "Coffee Company"
  }
}
Did this help?

Yes

No
POST
Query Products
Returns a list of up to 100 products, given the provided paging, sorting and filtering. See Stores Pagination for more information.

Permissions
Read Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores-reader/v1/products/query
Body Params
query
Query
Show Child Properties
includeVariants
boolean
Whether variants should be included in the response.

includeHiddenProducts
boolean
Whether hidden products should be included in the response. Requires permissions to manage products.

includeMerchantSpecificData
boolean
Whether merchant specific data should be included in the response. Requires permissions to manage products.

Response Object
products
Array <Product>
Show Child Properties
metadata
Metadata
Show Child Properties
totalResults
integer
Example shown:
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/query' \
    --data-binary '{
                     "includeVariants": true
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "products": [
    {
      "id": "131604aa-169f-d3e8-f076-a967b03e880c",
      "name": "T-Shirt",
      "slug": "t-shirt",
      "visible": true,
      "productType": "physical",
      "description": "<p>Made from 100% cotton</p>",
      "stock": {
        "trackInventory": true,
        "quantity": 300,
        "inStock": true
      },
      "price": {
        "currency": "USD",
        "price": 10,
        "discountedPrice": 10,
        "formatted": {
          "price": "$10.00",
          "discountedPrice": "$10.00"
        }
      },
      "priceData": {
        "currency": "USD",
        "price": 10,
        "discountedPrice": 10,
        "formatted": {
          "price": "$10.00",
          "discountedPrice": "$10.00"
        }
      },
      "convertedPriceData": {
        "currency": "USD",
        "price": 10,
        "discountedPrice": 10,
        "formatted": {
          "price": "$10.00",
          "discountedPrice": "$10.00"
        }
      },
      "additionalInfoSections": [
        {
          "title": "Care Instructions",
          "description": "<p>Wash with similar colors</p>\n"
        }
      ],
      "ribbons": [
        {
          "text": "Soft and comfy"
        }
      ],
      "ribbon": "Soft and comfy",
      "brand": "Nice",
      "media": {
        "mainMedia": {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_1500,h_1500,q_90/file.jpg",
            "width": 1500,
            "height": 1500
          },
          "id": "c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg"
        },
        "items": [
          {
            "thumbnail": {
              "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
              "width": 50,
              "height": 50
            },
            "mediaType": "image",
            "title": "",
            "image": {
              "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_1500,h_1500,q_90/file.jpg",
              "width": 1500,
              "height": 1500
            },
            "id": "c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg"
          },
          {
            "thumbnail": {
              "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
              "width": 50,
              "height": 50
            },
            "mediaType": "image",
            "title": "",
            "image": {
              "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_1280,h_1600,q_90/file.jpg",
              "width": 1280,
              "height": 1600
            },
            "id": "c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg"
          }
        ]
      },
      "customTextFields": [
        {
          "title": "What would like us to print on the t-shirt?",
          "maxLength": 100,
          "mandatory": false
        }
      ],
      "manageVariants": true,
      "productOptions": [
        {
          "optionType": "drop_down",
          "name": "Size",
          "choices": [
            {
              "value": "Small",
              "description": "Small",
              "media": {
                "items": []
              },
              "inStock": true,
              "visible": true
            },
            {
              "value": "Medium",
              "description": "Medium",
              "media": {
                "items": []
              },
              "inStock": true,
              "visible": true
            },
            {
              "value": "Large",
              "description": "Large",
              "media": {
                "items": []
              },
              "inStock": true,
              "visible": true
            }
          ]
        },
        {
          "optionType": "drop_down",
          "name": "Color",
          "choices": [
            {
              "value": "White",
              "description": "White",
              "media": {
                "mainMedia": {
                  "thumbnail": {
                    "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
                    "width": 50,
                    "height": 50
                  },
                  "mediaType": "image",
                  "title": "",
                  "image": {
                    "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_1500,h_1500,q_90/file.jpg",
                    "width": 1500,
                    "height": 1500
                  },
                  "id": "c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg"
                },
                "items": [
                  {
                    "thumbnail": {
                      "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
                      "width": 50,
                      "height": 50
                    },
                    "mediaType": "image",
                    "title": "",
                    "image": {
                      "url": "https://static.wixstatic.com/media/c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg/v1/fit/w_1500,h_1500,q_90/file.jpg",
                      "width": 1500,
                      "height": 1500
                    },
                    "id": "c43190_d99f81734a054ee2bacf6b9ebe81a438~mv2.jpg"
                  }
                ]
              },
              "inStock": true,
              "visible": true
            },
            {
              "value": "Black",
              "description": "Black",
              "media": {
                "mainMedia": {
                  "thumbnail": {
                    "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
                    "width": 50,
                    "height": 50
                  },
                  "mediaType": "image",
                  "title": "",
                  "image": {
                    "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_1280,h_1600,q_90/file.jpg",
                    "width": 1280,
                    "height": 1600
                  },
                  "id": "c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg"
                },
                "items": [
                  {
                    "thumbnail": {
                      "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
                      "width": 50,
                      "height": 50
                    },
                    "mediaType": "image",
                    "title": "",
                    "image": {
                      "url": "https://static.wixstatic.com/media/c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg/v1/fit/w_1280,h_1600,q_90/file.jpg",
                      "width": 1280,
                      "height": 1600
                    },
                    "id": "c43190_2c01c9a0195d4356b6d014818ca5841a~mv2.jpg"
                  }
                ]
              },
              "inStock": true,
              "visible": true
            }
          ]
        }
      ],
      "productPageUrl": {
        "base": "www.my-website.com",
        "path": "/product-page/t-shirt"
      },
      "numericId": "1608035843758000",
      "inventoryItemId": "ece9fb55-e960-2c17-0f89-56984fc177f3",
      "discount": {
        "type": "NONE",
        "value": 0
      },
      "collectionIds": [],
      "variants": [
        {
          "id": "c9f8678b-af10-4dc2-8e0e-3e823a5491df",
          "choices": {
            "Size": "Small",
            "Color": "White"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10000",
            "visible": true
          }
        },
        {
          "id": "44be1f7b-d32d-419d-b04d-a2a9342cf9e6",
          "choices": {
            "Size": "Small",
            "Color": "Black"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10003",
            "visible": true
          }
        },
        {
          "id": "75f7dbd2-9c6c-47bb-8d39-fe7de085a942",
          "choices": {
            "Size": "Medium",
            "Color": "White"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10001",
            "visible": true
          }
        },
        {
          "id": "9fbd21c2-6480-4428-89f6-304d48f081e2",
          "choices": {
            "Size": "Medium",
            "Color": "Black"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10004",
            "visible": true
          }
        },
        {
          "id": "e9f502a9-a770-4441-a407-b9d043c22b85",
          "choices": {
            "Size": "Large",
            "Color": "White"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10002",
            "visible": true
          }
        },
        {
          "id": "c9904f6b-d82f-4872-a4d9-de5ef5580126",
          "choices": {
            "Size": "Large",
            "Color": "Black"
          },
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 10,
              "discountedPrice": 10,
              "formatted": {
                "price": "$10.00",
                "discountedPrice": "$10.00"
              }
            },
            "weight": 0.3,
            "sku": "10005",
            "visible": true
          }
        }
      ],
      "lastUpdated": "2020-12-15T14:00:27.415Z",
      "seoData": {
        "tags": [
          {
            "type": "title",
            "children": "T-Shirt",
            "custom": false,
            "disabled": false
          },
          {
            "type": "meta",
            "props": {
              "name": "description",
              "content": "Made from 100% organic cotton"
            },
            "children": "",
            "custom": false,
            "disabled": false
          }
        ]
      }
    },
    {
      "id": "0873ed58-f88d-77d1-4566-afd4c50d253e",
      "name": "Digital product",
      "slug": "digital-product",
      "visible": true,
      "productType": "digital",
      "description": "<p>A digital product delivered upon payment</p>",
      "sku": "",
      "weight": 0,
      "stock": {
        "trackInventory": false,
        "inStock": true
      },
      "price": {
        "currency": "USD",
        "price": 20,
        "discountedPrice": 20,
        "formatted": {
          "price": "$20.00",
          "discountedPrice": "$20.00"
        }
      },
      "priceData": {
        "currency": "USD",
        "price": 20,
        "discountedPrice": 20,
        "formatted": {
          "price": "$20.00",
          "discountedPrice": "$20.00"
        }
      },
      "convertedPriceData": {
        "currency": "USD",
        "price": 20,
        "discountedPrice": 20,
        "formatted": {
          "price": "$20.00",
          "discountedPrice": "$20.00"
        }
      },
      "additionalInfoSections": [],
      "ribbons": [
        {
          "text": "New arrival"
        }
      ],
      "ribbon": "New arrival",
      "brand": "Nice",
      "media": {
        "items": []
      },
      "customTextFields": [],
      "manageVariants": false,
      "productOptions": [],
      "productPageUrl": {
        "base": "https://www.my-website.com",
        "path": "/product-page/digital-product"
      },
      "numericId": "1608041194964000",
      "inventoryItemId": "f78c12a7-0772-882e-ba99-502b3af2dac1",
      "discount": {
        "type": "NONE",
        "value": 0
      },
      "collectionIds": [],
      "variants": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "choices": {},
          "variant": {
            "priceData": {
              "currency": "USD",
              "price": 20,
              "discountedPrice": 20,
              "formatted": {
                "price": "$20.00",
                "discountedPrice": "$20.00"
              }
            },
            "convertedPriceData": {
              "currency": "USD",
              "price": 20,
              "discountedPrice": 20,
              "formatted": {
                "price": "$20.00",
                "discountedPrice": "$20.00"
              }
            },
            "weight": 0,
            "sku": "",
            "visible": true
          }
        }
      ],
      "lastUpdated": "2020-12-15T14:06:34.964Z"
    }
  ],
  "metadata": {
    "items": 100,
    "offset": 0
  },
  "totalResults": 2
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
GET
Get Product
Retrieves a product with the provided ID.

Permissions
Read Products
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores-reader/v1/products/{id}
Path Params
id
string
Required
Requested product ID.

Query Params
includeMerchantSpecificData
boolean
Whether merchant specific data, such as cost and profit data, should be included in the response. Requires permissions to manage products.

Response Object
product
Product
Requested product data.

Show Child Properties
Example shown:
Get Product including merchant-specific data
Request
cURL
curl -X GET \
   'https: //www.wixapis.com/stores/v1/products/91f7ac8b-2baa-289c-aa50-6d64764f35d3?includeMerchantSpecificData=true' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "product": {
    "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
    "name": "Colombian Arabica",
    "slug": "colombian-arabica-1",
    "visible": true,
    "productType": "physical",
    "description": "<p>The best organic coffee that Colombia has to offer.</p>",
    "stock": {
      "trackInventory": false,
      "inStock": true,
      "inventoryStatus": "IN_STOCK"
    },
    "weightRange": {
      "minValue": 0.25,
      "maxValue": 1
    },
    "price": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "priceData": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "convertedPriceData": {
      "currency": "USD",
      "price": 35,
      "discountedPrice": 30,
      "formatted": {
        "price": "$35.00",
        "discountedPrice": "$30.00",
        "pricePerUnit": "$0.12"
      },
      "pricePerUnit": 0.12
    },
    "priceRange": {
      "minValue": 35,
      "maxValue": 70
    },
    "costRange": {
      "minValue": 20,
      "maxValue": 40
    },
    "pricePerUnitData": {
      "totalQuantity": 250,
      "totalMeasurementUnit": "G",
      "baseQuantity": 1,
      "baseMeasurementUnit": "G"
    },
    "additionalInfoSections": [
      {
        "title": "Storage recommendations",
        "description": "<p>To&nbsp;preserve&nbsp;your beans' fresh roasted flavor as long as possible, store them in an opaque, air-tight container at room temperature.</p>\n"
      }
    ],
    "ribbons": [
      {
        "text": "Organic and Fair trade"
      }
    ],
    "media": {
      "mainMedia": {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "width": 6000,
          "height": 3376
        },
        "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg"
      },
      "items": [
        {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
            "width": 6000,
            "height": 3376
          },
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg"
        }
      ]
    },
    "customTextFields": [
      {
        "title": "What would you like us to print on the custom label?",
        "maxLength": 200,
        "mandatory": false
      }
    ],
    "manageVariants": true,
    "productOptions": [
      {
        "optionType": "drop_down",
        "name": "Weight",
        "choices": [
          {
            "value": "250g",
            "description": "250g",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          },
          {
            "value": "500g",
            "description": "500g",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          }
        ]
      },
      {
        "optionType": "drop_down",
        "name": "Ground for",
        "choices": [
          {
            "value": "Stovetop",
            "description": "Stovetop",
            "media": {
              "items": []
            },
            "inStock": true,
            "visible": true
          },
          {
            "value": "Filter",
            "description": "Filter",
            "inStock": true,
            "visible": true
          }
        ]
      }
    ],
    "productPageUrl": {
      "base": "https://wixsite.com/examplestore",
      "path": "/product-page/colombian-arabica-1"
    },
    "numericId": "1586693639134000",
    "inventoryItemId": "6e085374-d455-d763-55af-929b89b0ca2c",
    "discount": {
      "type": "AMOUNT",
      "value": 5
    },
    "collectionIds": [
      "32fd0b3a-2d38-2235-7754-78a3f819274a",
      "00000000-000000-000000-000000000001"
    ],
    "variants": [
      {
        "id": "00000000-0000-0020-0005-a316e6ba5b37",
        "choices": {
          "Weight": "250g",
          "Ground for": "Stovetop"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "costAndProfitData": {
            "itemCost": 20,
            "formattedItemCost": "$20.00",
            "profit": 10,
            "formattedProfit": "$10.00",
            "profitMargin": 0.3333
          },
          "weight": 0.25,
          "sku": "10001",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-0021-0005-a316e6ba5b37",
        "choices": {
          "Weight": "250g",
          "Ground for": "Filter"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 35,
            "discountedPrice": 30,
            "formatted": {
              "price": "$35.00",
              "discountedPrice": "$30.00",
              "pricePerUnit": "$0.12"
            },
            "pricePerUnit": 0.12
          },
          "costAndProfitData": {
            "itemCost": 20,
            "formattedItemCost": "$20.00",
            "profit": 10,
            "formattedProfit": "$10.00",
            "profitMargin": 0.3333
          },
          "weight": 0.25,
          "sku": "10003",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-003f-0005-a316e6ba5b37",
        "choices": {
          "Weight": "500g",
          "Ground for": "Stovetop"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 65,
            "discountedPrice": 60,
            "formatted": {
              "price": "$65.00",
              "discountedPrice": "$60.00",
              "pricePerUnit": "$0.24"
            },
            "pricePerUnit": 0.24
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 65,
            "discountedPrice": 60,
            "formatted": {
              "price": "$65.00",
              "discountedPrice": "$60.00",
              "pricePerUnit": "$0.24"
            },
            "pricePerUnit": 0.24
          },
          "costAndProfitData": {
            "itemCost": 40,
            "formattedItemCost": "$40.00",
            "profit": 20,
            "formattedProfit": "$20.00",
            "profitMargin": 0.3333
          },
          "weight": 0.5,
          "sku": "10002",
          "visible": true
        }
      },
      {
        "id": "00000000-0000-0040-0005-a316e6ba5b37",
        "choices": {
          "Weight": "500g",
          "Ground for": "Filter"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 70,
            "discountedPrice": 65,
            "formatted": {
              "price": "$70.00",
              "discountedPrice": "$65.00",
              "pricePerUnit": "$0.26"
            },
            "pricePerUnit": 0.26
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 70,
            "discountedPrice": 65,
            "formatted": {
              "price": "$70.00",
              "discountedPrice": "$65.00",
              "pricePerUnit": "$0.26"
            },
            "pricePerUnit": 0.26
          },
          "costAndProfitData": {
            "itemCost": 40,
            "formattedItemCost": "$40.00",
            "profit": 25,
            "formattedProfit": "$25.00",
            "profitMargin": 0.3846
          },
          "weight": 1,
          "sku": "10004",
          "visible": true
        }
      }
    ],
    "lastUpdated": "2022-07-12T10:02:26.664Z",
    "createdDate": "2020-04-12T12:13:59.134Z",
    "seoData": {
      "tags": [
        {
          "type": "title",
          "children": "Colombian Arabica | Organic and Fair Trade",
          "custom": false,
          "disabled": false
        },
        {
          "type": "meta",
          "props": {
            "name": "description",
            "content": "The best organic fair trade coffee that Colombia has to offer."
          },
          "children": "",
          "custom": false,
          "disabled": false
        }
      ]
    },
    "ribbon": "Organic and Fair trade",
    "brand": "Coffee Company"
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Query Collections
Retrieves a list of up to 100 collections, given the provided paging, sorting and filtering. See Stores Pagination for more information.

Permissions
Read Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores-reader/v1/collections/query
Body Params
query
Query
Query options.

Show Child Properties
includeNumberOfProducts
boolean
Whether number of products should be included in the response.

includeDescription
boolean
Wether to include collection description in the response. When false is passed, collection.description will return null.

Response Object
collections
Array <Collection>
List of collections.

Show Child Properties
metadata
Metadata
Details on the paged set of results returned.

Show Child Properties
totalResults
integer
Total number of results returned.

Example shown:
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/collections/query' \
    --data-binary '{
      "query": {
        "filter": {
          "name": "my collection"
          }
        }
    }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "collections": [
    {
      "id": "00000000-000000-000000-000000000001",
      "name": "my collection",
      "slug": "my-collection",
      "visible": true,
      "media": {
        "mainMedia": {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/697bc8_43b2c20a2d4144c797ca3cf4d2a7290f~mv2_d_2489_2251_s_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/697bc8_43b2c20a2d4144c797ca3cf4d2a7290f~mv2_d_2489_2251_s_2.jpg/v1/fit/w_2489,h_2251,q_90/file.jpg",
            "width": 2489,
            "height": 2251
          },
          "id": ""
        },
        "items": [
          {
            "thumbnail": {
              "url": "https://static.wixstatic.com/media/697bc8_43b2c20a2d4144c797ca3cf4d2a7290f~mv2_d_2489_2251_s_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
              "width": 50,
              "height": 50
            },
            "mediaType": "image",
            "title": "",
            "image": {
              "url": "https://static.wixstatic.com/media/697bc8_43b2c20a2d4144c797ca3cf4d2a7290f~mv2_d_2489_2251_s_2.jpg/v1/fit/w_2489,h_2251,q_90/file.jpg",
              "width": 2489,
              "height": 2251
            },
            "id": ""
          }
        ]
      }
    },
    {
      "id": "7f79cca8-80b6-d24b-e6f8-356187d95050",
      "name": "C A C T I",
      "slug": "c-a-c-t-i",
      "visible": true,
      "media": {
        "mainMedia": {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/697bc8_49e72a53cd064655ba1991bf1d7c1deb~mv2_d_1920_1920_s_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/697bc8_49e72a53cd064655ba1991bf1d7c1deb~mv2_d_1920_1920_s_2.jpg/v1/fit/w_1920,h_1920,q_90/file.jpg",
            "width": 1920,
            "height": 1920
          },
          "id": ""
        },
        "items": [
          {
            "thumbnail": {
              "url": "https://static.wixstatic.com/media/697bc8_49e72a53cd064655ba1991bf1d7c1deb~mv2_d_1920_1920_s_2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
              "width": 50,
              "height": 50
            },
            "mediaType": "image",
            "title": "",
            "image": {
              "url": "https://static.wixstatic.com/media/697bc8_49e72a53cd064655ba1991bf1d7c1deb~mv2_d_1920_1920_s_2.jpg/v1/fit/w_1920,h_1920,q_90/file.jpg",
              "width": 1920,
              "height": 1920
            },
            "id": ""
          }
        ]
      }
    }
  ],
  "metadata": {
    "items": 100,
    "offset": 0
  },
  "totalResults": 2
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
GET
Get Collection
Retrieves a collection with the provided ID.

Permissions
Read Products
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores-reader/v1/collections/{id}
Path Params
id
string
Required
Requested collection ID.

Query Params
includeNumberOfProducts
boolean
Whether to return the collection.numberOfProducts field in the response. Defaults to false, in which case the value of collection.numberOfProducts will be 0.

Response Object
collection
Collection
The requested collection.

Show Child Properties
Example shown:
Get Collection and include number of products
Request
cURL
curl -X GET \
   'https://www.wixapis.com/stores/v1/collections/32fd0b3a-2d38-2235-7754-78a3f819274a?includeNumberOfProducts=true' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "collection": {
    "id": "32fd0b3a-2d38-2235-7754-78a3f819274a",
    "name": "Coffee Products",
    "slug": "coffee-products",
    "visible": true,
    "description": "Some Coffee Products",
    "media": {
      "mainMedia": {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_6630,h_5304,q_90/file.jpg",
          "width": 6630,
          "height": 5304
        },
        "id": ""
      },
      "items": [
        {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_6630,h_5304,q_90/file.jpg",
            "width": 6630,
            "height": 5304
          },
          "id": ""
        }
      ]
    },
    "numberOfProducts": 5
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
GET
Get Collection By Slug
Retrieves a collection with the provided slug.

Permissions
Read Products
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores-reader/v1/collections/slug/{slug}
Path Params
slug
string
Required
Slug of the collection to retrieve.

Response Object
collection
Collection
The requested collection.

Show Child Properties
Example shown:
Get Collection By Slug Example 1
Request
cURL
curl -X GET \
   'https://www.wixapis.com/stores/v1/collections/slug/coffee-products' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "collection": {
    "id": "32fd0b3a-2d38-2235-7754-78a3f819274a",
    "name": "Coffee Products",
    "slug": "coffee-products",
    "visible": true,
    "description": "Some Coffee Products",
    "media": {
      "mainMedia": {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_6630,h_5304,q_90/file.jpg",
          "width": 6630,
          "height": 5304
        },
        "id": ""
      },
      "items": [
        {
          "thumbnail": {
            "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
            "width": 50,
            "height": 50
          },
          "mediaType": "image",
          "title": "",
          "image": {
            "url": "https://static.wixstatic.com/media/11062b_5ccf31f886ec449f84a18ecdf58e05ec~mv2.jpg/v1/fit/w_6630,h_5304,q_90/file.jpg",
            "width": 6630,
            "height": 5304
          },
          "id": ""
        }
      ]
    },
    "numberOfProducts": 5
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Get Product Options Availability
Gets the availability of relevant product variants based on the product ID and selections provided. See Use Cases for an example.

Permissions
Read Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores-reader/v1/products/{id}/productOptionsAvailability
Path Params
id
string
Required
Requested product ID.

Body Params
options
Map <string, string>
format map
Array containing the selected options. For example, {"color": "Blue", "size": "Large"}.

Response Object
selectedVariant
SelectedVariant
Variant information, given that all the choices were provided.

Show Child Properties
media
Media
Information about media items (images, videos, etc.) associated with this choice.

Show Child Properties
productOptions
Array <ProductOption>
Options information (color, size, etc.) for this product, with the inventory and visibility fields updated based on the provided choices.

Show Child Properties
availableForPurchase
boolean
Whether all the selected choices result in a visible, in-stock variant.

Example shown:
Get Product Options Availability Example 1
Request
cURL
curl -X POST \
    'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/productOptionsAvailability' \
    --data-binary '{
                     "options": {
                       "Size": "S",
                       "Color": "Green"
                     }
                   }' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: <AUTH>'
Response
JSON
{
  "productOptions": [
    {
      "optionType": "color",
      "name": "Color",
      "choices": [
        {
          "value": "#008000",
          "description": "Green",
          "inStock": true,
          "visible": true
        },
        {
          "value": "#800080",
          "description": "Purple",
          "inStock": true,
          "visible": true
        }
      ]
    }
  ],
  "availableForPurchase": false
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Query Product Variants
Retrieves product variants, based on either choices (option-choice key-value pairs) or variant IDs. See Stores Pagination for more information.

Permissions
Read Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores-reader/v1/products/{id}/variants/query
Path Params
id
string
Required
Requested product ID.

Body Params
choices
Map <string, string>
format map
The specific choices available or chosen from within a selection (e.g., choosing the red Selection triggers the red Choice). You may specify all the relevant choices for a specific variant, or only some of the options, which will return all corresponding variants (not relevant when passing variant IDs).

variantIds
Array <string>
List of variant IDs (not relevant when passing choices).

paging
Paging
Show Child Properties
includeMerchantSpecificData
boolean
Whether merchant specific data should be included in the response. Requires permissions to manage products.

Response Object
variants
Array <Variant>
List of variants based on the specified filters and sorting.

Show Child Properties
metadata
Metadata
Show Child Properties
totalResults
integer
Example shown:
Query Product Variants Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/0614129c-8777-9f3b-4dfe-b80a54df10d5/variants/query' \
    --data-binary '{
                      "choices": {
                        "Weight": "250g"
                      },
                      "includeMerchantSpecificData": true
                    }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "variants": [
    {
      "id": "00000000-0000-0020-0005-a316e6ba5b37",
      "choices": {
        "Weight": "250g",
        "Ground for": "Stovetop"
      },
      "variant": {
        "priceData": {
          "currency": "USD",
          "price": 35,
          "discountedPrice": 30,
          "formatted": {
            "price": "$35.00",
            "discountedPrice": "$30.00",
            "pricePerUnit": "$0.12"
          },
          "pricePerUnit": 0.12
        },
        "convertedPriceData": {
          "currency": "USD",
          "price": 35,
          "discountedPrice": 30,
          "formatted": {
            "price": "$35.00",
            "discountedPrice": "$30.00",
            "pricePerUnit": "$0.12"
          },
          "pricePerUnit": 0.12
        },
        "costAndProfitData": {
          "itemCost": 20,
          "formattedItemCost": "$20.00",
          "profit": 10,
          "formattedProfit": "$10.00",
          "profitMargin": 0.3333
        },
        "weight": 0.25,
        "sku": "10001",
        "visible": true
      }
    },
    {
      "id": "00000000-0000-0021-0005-a316e6ba5b37",
      "choices": {
        "Weight": "250g",
        "Ground for": "Filter"
      },
      "variant": {
        "priceData": {
          "currency": "USD",
          "price": 35,
          "discountedPrice": 30,
          "formatted": {
            "price": "$35.00",
            "discountedPrice": "$30.00",
            "pricePerUnit": "$0.12"
          },
          "pricePerUnit": 0.12
        },
        "convertedPriceData": {
          "currency": "USD",
          "price": 35,
          "discountedPrice": 30,
          "formatted": {
            "price": "$35.00",
            "discountedPrice": "$30.00",
            "pricePerUnit": "$0.12"
          },
          "pricePerUnit": 0.12
        },
        "costAndProfitData": {
          "itemCost": 20,
          "formattedItemCost": "$20.00",
          "profit": 10,
          "formattedProfit": "$10.00",
          "profitMargin": 0.3333
        },
        "weight": 0.25,
        "sku": "10003",
        "visible": true
      }
    }
  ],
  "metadata": {
    "items": 2,
    "offset": 0
  },
  "totalResults": 2
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Query Store Variants
Retrieves up to 100 store variants, given the provided paging, filtering, and sorting.

Permissions
Read Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores-reader/v1/variants/query
Body Params
query
Query
Query options.

Show Child Properties
Response Object
variants
Array <StoreVariant>
List of variants based on the specified filters and sorting.

Show Child Properties
metadata
Metadata
Details on the paged set of results returned.

Show Child Properties
Example shown:
Query Store Variants Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/variants/query' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "variants": [
    {
      "id": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a-00000000-0000-0020-0005-ad9cdc10d3b8",
      "variantId": "00000000-0000-0020-0005-ad9cdc10d3b8",
      "productId": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a",
      "variantName": "250g | Stovetop",
      "productName": "Indonesian Blend",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg/v1/fit/w_2977,h_3951,q_90/file.jpg",
          "height": 3951,
          "width": 2977
        }
      },
      "customFields": {}
    },
    {
      "id": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a-00000000-0000-0021-0005-ad9cdc10d3b8",
      "variantId": "00000000-0000-0021-0005-ad9cdc10d3b8",
      "productId": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a",
      "variantName": "250g | Filter",
      "productName": "Indonesian Blend",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg/v1/fit/w_2977,h_3951,q_90/file.jpg",
          "height": 3951,
          "width": 2977
        }
      },
      "customFields": {}
    },
    {
      "id": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a-00000000-0000-003f-0005-ad9cdc10d3b8",
      "variantId": "00000000-0000-003f-0005-ad9cdc10d3b8",
      "productId": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a",
      "variantName": "500g | Stovetop",
      "productName": "Indonesian Blend",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg/v1/fit/w_2977,h_3951,q_90/file.jpg",
          "height": 3951,
          "width": 2977
        }
      },
      "customFields": {}
    },
    {
      "id": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a-00000000-0000-0040-0005-ad9cdc10d3b8",
      "variantId": "00000000-0000-0040-0005-ad9cdc10d3b8",
      "productId": "5376f9ec-b92e-efa9-e4a1-f4f480aa0d3a",
      "variantName": "500g | Filter",
      "productName": "Indonesian Blend",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_316b6449475f3235386255~mv2_d_2977_3951_s_4_2.jpg/v1/fit/w_2977,h_3951,q_90/file.jpg",
          "height": 3951,
          "width": 2977
        }
      },
      "customFields": {}
    },
    {
      "id": "0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-0020-0005-a316f7c67df7",
      "variantId": "00000000-0000-0020-0005-a316f7c67df7",
      "productId": "0614129c-8777-9f3b-4dfe-b80a54df10d5",
      "variantName": "250g | Stovetop",
      "productName": "Brazilian Arabica",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg/v1/fit/w_4517,h_2992,q_90/file.jpg",
          "height": 2992,
          "width": 4517
        }
      },
      "customFields": {}
    },
    {
      "id": "0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-0021-0005-a316f7c67df7",
      "variantId": "00000000-0000-0021-0005-a316f7c67df7",
      "productId": "0614129c-8777-9f3b-4dfe-b80a54df10d5",
      "variantName": "250g | Filter",
      "productName": "Brazilian Arabica",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg/v1/fit/w_4517,h_2992,q_90/file.jpg",
          "height": 2992,
          "width": 4517
        }
      },
      "customFields": {}
    },
    {
      "id": "0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-003f-0005-a316f7c67df7",
      "variantId": "00000000-0000-003f-0005-a316f7c67df7",
      "productId": "0614129c-8777-9f3b-4dfe-b80a54df10d5",
      "variantName": "500g | Stovetop",
      "productName": "Brazilian Arabica",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg/v1/fit/w_4517,h_2992,q_90/file.jpg",
          "height": 2992,
          "width": 4517
        }
      },
      "customFields": {}
    },
    {
      "id": "0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-0040-0005-a316f7c67df7",
      "variantId": "00000000-0000-0040-0005-a316f7c67df7",
      "productId": "0614129c-8777-9f3b-4dfe-b80a54df10d5",
      "variantName": "500g | Filter",
      "productName": "Brazilian Arabica",
      "managedVariant": true,
      "sku": "",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg/v1/fit/w_4517,h_2992,q_90/file.jpg",
          "height": 2992,
          "width": 4517
        }
      },
      "customFields": {}
    },
    {
      "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3-00000000-0000-0020-0005-a316e6ba5b37",
      "variantId": "00000000-0000-0020-0005-a316e6ba5b37",
      "productId": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
      "variantName": "250g | Stovetop",
      "productName": "Colombian Arabica",
      "managedVariant": true,
      "sku": "10001",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "height": 3376,
          "width": 6000
        }
      },
      "customFields": {}
    },
    {
      "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3-00000000-0000-0021-0005-a316e6ba5b37",
      "variantId": "00000000-0000-0021-0005-a316e6ba5b37",
      "productId": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
      "variantName": "250g | Filter",
      "productName": "Colombian Arabica",
      "managedVariant": true,
      "sku": "10003",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "250g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "height": 3376,
          "width": 6000
        }
      },
      "customFields": {}
    },
    {
      "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3-00000000-0000-003f-0005-a316e6ba5b37",
      "variantId": "00000000-0000-003f-0005-a316e6ba5b37",
      "productId": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
      "variantName": "500g | Stovetop",
      "productName": "Colombian Arabica",
      "managedVariant": true,
      "sku": "10002",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Stovetop"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "height": 3376,
          "width": 6000
        }
      },
      "customFields": {}
    },
    {
      "id": "91f7ac8b-2baa-289c-aa50-6d64764f35d3-00000000-0000-0040-0005-a316e6ba5b37",
      "variantId": "00000000-0000-0040-0005-a316e6ba5b37",
      "productId": "91f7ac8b-2baa-289c-aa50-6d64764f35d3",
      "variantName": "500g | Filter",
      "productName": "Colombian Arabica",
      "managedVariant": true,
      "sku": "10004",
      "stock": {
        "trackQuantity": false,
        "quantity": 0,
        "inStock": true
      },
      "choices": {
        "Weight": "500g",
        "Ground for": "Filter"
      },
      "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
      "media": {
        "image": {
          "id": "nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg",
          "url": "https://static.wixstatic.com/media/nsplsh_5033504669385448625573~mv2_d_6000_3376_s_4_2.jpg/v1/fit/w_6000,h_3376,q_90/file.jpg",
          "height": 3376,
          "width": 6000
        }
      },
      "customFields": {}
    }
  ],
  "metadata": {
    "count": 12,
    "offset": 0,
    "total": 12,
    "cursors": {}
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
GET
Get Store Variant
Retrieves a store variant with the provided ID.

Permissions
Read Products
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores-reader/v1/variants/{id}
Path Params
id
string
Required
Store variant ID. Comprised of the productId and the variantId, separated by a hyphen. For example, {productId}-{variantId}.

Response Object
variant
Variant
The requested store variant.

Show Child Properties
Example shown:
Get Store Variant Example 1
Request
cURL
curl -X GET \
   'https: //www.wixapis.com/stores/v1/variants/0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-0020-0005-a316f7c67df7' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "variant": {
    "id": "0614129c-8777-9f3b-4dfe-b80a54df10d5-00000000-0000-0020-0005-a316f7c67df7",
    "variantId": "00000000-0000-0020-0005-a316f7c67df7",
    "productId": "0614129c-8777-9f3b-4dfe-b80a54df10d5",
    "variantName": "250g | Stovetop",
    "productName": "Brazilian Arabica",
    "managedVariant": true,
    "sku": "",
    "stock": {
      "trackQuantity": false,
      "quantity": 0,
      "inStock": true
    },
    "choices": {
      "Weight": "250g",
      "Ground for": "Stovetop"
    },
    "collectionIds": ["32fd0b3a-2d38-2235-7754-78a3f819274a"],
    "media": {
      "image": {
        "id": "nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg",
        "url": "https://static.wixstatic.com/media/nsplsh_306d666a306a4a74306459~mv2_d_4517_2992_s_4_2.jpg/v1/fit/w_4517,h_2992,q_90/file.jpg",
        "height": 2992,
        "width": 4517
      }
    },
    "customFields": {}
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Create Product
Creates a new product.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products
Body Params
product
Product
Product information.

Show Child Properties
Response Object
product
Product
Show Child Properties
Example shown:
Create Product Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products' \
    --data-binary '{
                     "product": {
                       "name": "T-shirt",
                       "productType": "physical",
                       "priceData": {
                         "price": 10.5
                       },
                       "costAndProfitData": {
                         "itemCost": 7
                       },
                       "description": "nice summer t-shirt",
                       "sku": "123df",
                       "visible": false,
                       "ribbon": "Sale",
                       "brand": "Nice",
                       "weight": 0.2,
                       "discount": {
                       	"type": "AMOUNT",
                       	"value": 1
                       },
                       "manageVariants": true,
                       "productOptions": [
                         {
                           "name": "Size",
                           "choices": [
                             {
                               "value": "S",
                               "description": "S"
                             },
                             {
                               "value": "L",
                               "description": "L"
                             }
                           ]
                         }
                       ]
                     }
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "product": {
    "id": "4224c24b-5a58-4d14-8793-623e812fa377",
    "name": "T-shirt",
    "slug": "t-shirt",
    "visible": false,
    "productType": "physical",
    "description": "nice summer t-shirt",
    "weightRange": {
      "minValue": 0,
      "maxValue": 0.2
    },
    "stock": {
      "trackInventory": false,
      "inStock": true,
      "inventoryStatus": "IN_STOCK"
    },
    "price": {
      "currency": "USD",
      "price": 10.5,
      "discountedPrice": 9.5,
      "formatted": {
        "price": "$10.50",
        "discountedPrice": "$9.50"
      }
    },
    "priceData": {
      "currency": "USD",
      "price": 10.5,
      "discountedPrice": 9.5,
      "formatted": {
        "price": "$10.50",
        "discountedPrice": "$9.50"
      }
    },
    "convertedPriceData": {
      "currency": "USD",
      "price": 10.5,
      "discountedPrice": 9.5,
      "formatted": {
        "price": "$10.50",
        "discountedPrice": "$9.50"
      }
    },
    "priceRange": {
      "minValue": 10.5,
      "maxValue": 10.5
    },
    "costRange": {
      "minValue": 0,
      "maxValue": 7
    },
    "additionalInfoSections": [],
    "ribbons": [
      {
        "text": "Sale"
      }
    ],
    "media": {
      "items": []
    },
    "customTextFields": [],
    "manageVariants": true,
    "productOptions": [
      {
        "optionType": "drop_down",
        "name": "Size",
        "choices": [
          {
            "value": "S",
            "description": "S",
            "inStock": true,
            "visible": true
          },
          {
            "value": "L",
            "description": "L",
            "inStock": true,
            "visible": true
          }
        ]
      }
    ],
    "productPageUrl": {
      "base": "https://wixsite.com/examplestore",
      "path": "/product-page/t-shirt"
    },
    "numericId": "1657626871550000",
    "inventoryItemId": "bddb3db4-a5a7-b2eb-786c-9dc17ed05c88",
    "discount": {
      "type": "AMOUNT",
      "value": 1
    },
    "collectionIds": ["00000000-000000-000000-000000000001"],
    "variants": [
      {
        "id": "05519a6e-222b-413a-957c-0ef7a32779b5",
        "choices": {
          "Size": "S"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 10.5,
            "discountedPrice": 9.5,
            "formatted": {
              "price": "$10.50",
              "discountedPrice": "$9.50"
            }
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 10.5,
            "discountedPrice": 9.5,
            "formatted": {
              "price": "$10.50",
              "discountedPrice": "$9.50"
            }
          },
          "costAndProfitData": {
            "itemCost": 7,
            "formattedItemCost": "$7.00",
            "profit": 2.5,
            "formattedProfit": "$2.50",
            "profitMargin": 0.2632
          },
          "weight": 0.2,
          "sku": "123df",
          "visible": false
        }
      },
      {
        "id": "0318a3d8-f31c-4ba3-98c7-387571a2eac4",
        "choices": {
          "Size": "L"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 10.5,
            "discountedPrice": 9.5,
            "formatted": {
              "price": "$10.50",
              "discountedPrice": "$9.50"
            }
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 10.5,
            "discountedPrice": 9.5,
            "formatted": {
              "price": "$10.50",
              "discountedPrice": "$9.50"
            }
          },
          "costAndProfitData": {
            "itemCost": 7,
            "formattedItemCost": "$7.00",
            "profit": 2.5,
            "formattedProfit": "$2.50",
            "profitMargin": 0.2632
          },
          "weight": 0.2,
          "sku": "123df",
          "visible": false
        }
      }
    ],
    "lastUpdated": "2022-07-12T11:54:31.550Z",
    "createdDate": "2022-07-12T11:54:31.550Z",
    "ribbon": "Sale",
    "brand": "Nice"
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
PATCH
Update Product
Updates specified fields in a product.

To update a single field across multiple products, use Bulk Update Product Property.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v1/products/{product.id}
Path Params
product.id
string
Required
Product ID (generated automatically by the catalog).

Body Params
product
Product
Required
Show Child Properties
Response Object
product
Product
Show Child Properties
Example shown:
Update Product Example 1
Request
cURL
curl -X PATCH \
   'https://www.wixapis.com/stores/v1/products/83f41911-5375-4ede-aafa-68f8b6dee9e2' \
    --data-binary '{
                     "product": {
                       "name": "T-shirt",
                       "productType": "physical",
                       "priceData": {
                         "price": 12.5
                       },
                       "description": "nice summer t-shirt",
                       "sku": "123df",
                       "visible": false,
                       "weight": 0.2,
                       "ribbon": "Sold Out",
                       "brand": "Nice",
                       "discount": {
                       	"type": "AMOUNT",
                       	"value": 2
                       },
                       "productOptions": [
                         {
                           "name": "Size",
                           "choices": [
                             {
                               "value": "S",
                               "description": "Small"
                             }
                           ]
                         }
                       ]
                     }
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "product": {
    "id": "83f41911-5375-4ede-aafa-68f8b6dee9e2",
    "name": "T-shirt",
    "slug": "t-shirt-1",
    "visible": false,
    "productType": "physical",
    "description": "nice summer t-shirt",
    "stock": {
      "trackInventory": false,
      "inStock": true
    },
    "price": {
      "currency": "USD",
      "price": 12.5,
      "discountedPrice": 10.5,
      "formatted": {
        "price": "$12.50",
        "discountedPrice": "$10.50"
      }
    },
    "priceData": {
      "currency": "USD",
      "price": 12.5,
      "discountedPrice": 10.5,
      "formatted": {
        "price": "$12.50",
        "discountedPrice": "$10.50"
      }
    },
    "convertedPriceData": {
      "currency": "USD",
      "price": 12.5,
      "discountedPrice": 10.5,
      "formatted": {
        "price": "$12.50",
        "discountedPrice": "$10.50"
      }
    },
    "additionalInfoSections": [],
    "ribbons": [
      {
        "text": "Sold Out"
      }
    ],
    "media": {
      "items": []
    },
    "customTextFields": [],
    "manageVariants": true,
    "productOptions": [
      {
        "optionType": "drop_down",
        "name": "Size",
        "choices": [
          {
            "value": "S",
            "description": "Small",
            "inStock": true,
            "visible": true
          }
        ]
      }
    ],
    "productPageUrl": {
      "base": "https://roysha.wixsite.com/roycoffeestore",
      "path": "/product-page/t-shirt-1"
    },
    "numericId": "1620048324853000",
    "inventoryItemId": "7c0be6ee-ac8a-b121-5505-97074921161d",
    "discount": {
      "type": "AMOUNT",
      "value": 2
    },
    "collectionIds": [],
    "variants": [
      {
        "id": "9a86bab7-0558-48a7-a953-0594e6d5534d",
        "choices": {
          "Size": "Small"
        },
        "variant": {
          "priceData": {
            "currency": "USD",
            "price": 12.5,
            "discountedPrice": 10.5,
            "formatted": {
              "price": "$12.50",
              "discountedPrice": "$10.50"
            }
          },
          "convertedPriceData": {
            "currency": "USD",
            "price": 12.5,
            "discountedPrice": 10.5,
            "formatted": {
              "price": "$12.50",
              "discountedPrice": "$10.50"
            }
          },
          "weight": 0.2,
          "sku": "123df",
          "visible": false
        }
      }
    ],
    "lastUpdated": "2021-05-03T13:44:17.610Z",
    "ribbon": "Sold Out",
    "brand": "Nice"
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
DELETE
Delete Product
Deletes a product.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
DELETE
https://www.wixapis.com/stores/v1/products/{id}
Path Params
id
string
Required
ID of the product to delete.

Response Object
Returns an empty object.
Example shown:
Delete Product Example 1
Request
cURL
curl -X DELETE \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
PATCH
Update Product Variants
Updates variants of a specified product.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v1/products/{id}/variants
Path Params
id
string
Required
ID of the product with managed variants.

Body Params
variants
Array <VariantOverride>
Variant info to update.

Show Child Properties
Response Object
variants
Array <Variant>
List of the product's variants.

Show Child Properties
Example shown:
Update Product Variants Example 1
Request
cURL
curl -X PATCH \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/variants' \
    --data-binary '{
        "variants": [
            {
            "choices": {
                "Size": 'S',
                "Color": 'Blue'
            },
            "price": 100
            }
          ]
        }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "variants": [
    {
      "id": "00000000-0000-0020-0005-92338aaf6c4a",
      "choices": {
        "Size": "S",
        "Color": "Blue"
      },
      "variant": {
        "priceData": {
          "currency": "USD",
          "price": 100,
          "discountedPrice": 100,
          "formatted": {
            "price": "$100.00",
            "discountedPrice": "$100.00"
          }
        },
        "weight": 0,
        "sku": "",
        "visible": true
      }
    }
  ]
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Reset All Product Variant Data
Resets the data (such as the price and the weight) of all variants for a given product to their default values.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/variants/resetToDefault
Path Params
id
string
Required
Product ID.

Response Object
Returns an empty object.
Example shown:
Reset All Product Variant Data Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/variants/resetToDefault' \
   --data-binary '{}' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Add Products To Collection
Adds products to a specified collection.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/collections/{id}/productIds
Path Params
id
string
Required
Collection ID.

Body Params
productIds
Array <string>
maxItems 1000
IDs of the products to add to the collection, separated by commas.

Response Object
Returns an empty object.
Example shown:
Add Products To Collection Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/collections/1044e7e4-37d1-0705-c5b3-623baae212fd/productIds' \
    --data-binary '{
                     "productIds": [
                       "a60fef92-ee29-070f-a7ed-9bbc3cc1c2f4",
                       "d9cd1d2f-8318-486b-a6f3-aa0c4e81ccd2"
                     ]
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Remove Products From Collection
Deletes products from a specified collection.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/collections/{id}/productIds/delete
Path Params
id
string
Required
Collection ID.

Body Params
productIds
Array <string>
Required
maxItems 1000
IDs of the products to remove from the collection.

Response Object
Returns an empty object.
Example shown:
Remove Products From Collection Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/collections/1044e7e4-37d1-0705-c5b3-623baae212fd/productIds/delete' \
    --data-binary '{
                     "productIds": [
                       "a60fef92-ee29-070f-a7ed-9bbc3cc1c2f4",
                       "d9cd1d2f-8318-486b-a6f3-aa0c4e81ccd2"
                     ]
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Add Product Media
Adds media items to a specified product, either via URL or existing media ID.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/media
Path Params
id
string
Required
Product ID.

Body Params
media
Array <MediaDataForWrite>
minItems 1
maxItems 50
Sources of media items already uploaded to the Wix site.

Show Child Properties
Response Object
Returns an empty object.
Example shown:
Add Product Media Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/media' \
    --data-binary '{
                     "media": [
                       {
                         "mediaId": "9cc22d8b8d5244aba9ed73fb1783fc26.jpg"
                       },
                       {
                         "url": "https://your-site-url/image.jpeg",
                         "choice": {
                            "option": "Color",
                            "choice": "Blue"
                         }
                       },
                       {
                         "mediaId": "11062b_382eeb350464462c8f9150e4d3e40f2b"
                       }
                     ]
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Remove Product Media
Removes specified media items from a product. Pass an empty array to remove all media items.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/media/delete
Path Params
id
string
Required
Product ID.

Body Params
mediaIds
Array <string>
maxItems 50
List of media IDs to remove. Pass an empty array to delete all media items for the product.

Response Object
Returns an empty object.
Example shown:
Remove Product Media Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/media/delete' \
    --data-binary '{
                     "mediaIds": [
                       "mediaId1",
                       "mediaId2"
                     ]
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
PATCH
Add Product Media To Choices
Links media items that are already associated with a specific product to a choice within the same product.

Media items can only be set for choices within one option at a time - e.g., if you set media items for some or all of the choices within the Colors option (blue, green, and red), you won't be able to also assign media items to choices within the Size option (S, M, and L).

To remove all existing media items, call the Remove Product Media From Choices endpoint.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v1/products/{id}/choices/media
Path Params
id
string
Required
Product ID.

Body Params
media
Array <MediaAssignmentToChoice>
minItems 1
maxItems 10
Product media items and the choices to add the media to.

Show Child Properties
Response Object
Returns an empty object.
Example shown:
Add 2 media items to an option choice
Request
cURL
curl -X POST \
  'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/choices/media' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: <AUTH>' \
  -d '{
        "media": [
          {
            "option": "Color",
            "choice": "blue",
            "mediaIds": [
              "9cc22d8b8d5244aba9ed73fb1783fc26.jpg",
              "fljseif3l4ij3l4ijl3r32fwfwf23234.jpg"
            ]
          }
        ]
      }'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Remove Product Media From Choices
Removes media items from all or some of a product's choices. (Media items can only be set for choices within one option at a time - e.g., if you set media items for some or all of the choices within the Colors option (blue, green, and red), you won't be able to also assign media items to choices within the Size option (S, M, and L).)

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/choices/media/delete
Path Params
id
string
Required
Product ID from whose choices to remove media items.

Body Params
media
Array <MediaAssignmentToChoice>
minItems 1
maxItems 10
Media to remove from choices. If an empty array is passed, all media will be removed from all choices for the given product.

Show Child Properties
Response Object
Returns an empty object.
Example shown:
Remove Product Media From Choices Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/choices/media/delete' \
    --data-binary '{
                     "option": "Color",
                     "choice": "blue",
                     "mediaIds": [
                         "9cc22d8b8d5244aba9ed73fb1783fc26.jpg",
                         "fljseif3l4ij3l4ijl3r32fwfwf23234.jpg"
                     ]
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
DELETE
Delete Product Options
Delete all options from a specific product. Only available when variant management is disabled.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
DELETE
https://www.wixapis.com/stores/v1/products/{id}/options
Path Params
id
string
Required
ID of the product with options to delete.

Response Object
Returns an empty object.
Example shown:
Delete Product Options Example 1
Request
cURL
curl -X DELETE \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/options' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Remove Brand
Deletes a product's brand.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/remove-brand
Path Params
id
string
Required
Product ID.

Response Object
Returns an empty object.
Example shown:
Remove Brand Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/remove-brand' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Create Collection
Creates a new collection.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/collections
Body Params
collection
Collection
Required
Collection info.

Show Child Properties
Response Object
collection
Collection
Collection.

Show Child Properties
Example shown:
Create Collection Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/collections' \
    --data-binary '{
                   	"collection": {
                   		"name": "My New Collection"
                   	}
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "collection": {
    "id": "81093e7d-a251-4a22-a238-df3aa816f3dc",
    "name": "My New Collection",
    "slug": "my-new-collection",
    "visible": true,
    "media": {
      "items": []
    }
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
PATCH
Update Collection Properties
Updates specified properties of a collection. To add products to a collection, call the Add Products to Collection endpoint.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v1/collections/{collection.id}
Path Params
collection.id
string
Required
Collection ID (generated automatically by the catalog).

Body Params
collection
Collection
Required
Collection info.

Show Child Properties
Response Object
collection
Collection
Updated collection.

Show Child Properties
Example shown:
Update Collection Properties Example 1
Request
cURL
curl -X PATCH \
   'https://www.wixapis.com/stores/v1/collections/81093e7d-a251-4a22-a238-df3aa816f3dc' \
    --data-binary '{
                   	"collection": {
                   		"name": "Updated name"
                   	}
                   }' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{
  "collection": {
    "id": "81093e7d-a251-4a22-a238-df3aa816f3dc",
    "name": "Updated name",
    "media": {
      "items": []
    }
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
DELETE
Delete Collection
Deletes a collection.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
DELETE
https://www.wixapis.com/stores/v1/collections/{id}
Path Params
id
string
Required
ID of the collection to delete.

Response Object
Returns an empty object.
Example shown:
Delete Collection Example 1
Request
cURL
curl -X DELETE \
   'https://www.wixapis.com/stores/v1/collections/81093e7d-a251-4a22-a238-df3aa816f3dc' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Remove Ribbon
Deletes a product's ribbon.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/products/{id}/remove-ribbon
Path Params
id
string
Required
Product ID.

Response Object
Returns an empty object.
Example shown:
Remove Ribbon Example 1
Request
cURL
curl -X POST \
   'https://www.wixapis.com/stores/v1/products/1044e7e4-37d1-0705-c5b3-623baae212fd/remove-ribbon' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Bulk Update Product Property
Updates a specified property for up to 100 products at a time.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/bulk/products/update
Body Params
ids
Array <string>
Required
minItems 1
maxItems 100
Product IDs.

set
Set
Field to update.

Show Child Properties
Response Object
results
Array <BulkProductResult>
Bulk action results.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Request
cURL
curl -X POST \
  https://www.wixapis.com/stores/v1/bulk/products/update \
  -H 'Authorization: <AUTH>'
  -H 'Content-Type: application/json' \
  --data-binary '{
    "ids": [
      "bb6ddd51-7295-4fc8-8a4f-2521485c738d",
      "c36bbdbe-fbf8-4a43-810e-a0abdffe70ae",
      "2966543c-2b2f-4ca1-862c-6a04736c1063",
      "c9adb138-96f8-4f08-8626-9fef2445c490",
      "4ed1aa2c-c441-4e3f-8e57-a18886bf52bb"
    ],
    "set": {
      "price": 10.25
    }
  }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "bb6ddd51-7295-4fc8-8a4f-2521485c738d",
        "originalIndex": 0,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "c36bbdbe-fbf8-4a43-810e-a0abdffe70ae",
        "originalIndex": 1,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "2966543c-2b2f-4ca1-862c-6a04736c1063",
        "originalIndex": 2,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "c9adb138-96f8-4f08-8626-9fef2445c490",
        "originalIndex": 3,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "4ed1aa2c-c441-4e3f-8e57-a18886bf52bb",
        "originalIndex": 4,
        "success": true
      }
    }
  ],
  "bulkActionMetadata": {
    "totalSuccesses": 5,
    "totalFailures": 0,
    "undetailedFailures": 0
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Bulk Adjust Product Properties
Adjusts a specified numerical property for up to 100 products at a time. The property can be increased or decreased either by percentage or amount.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Products
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v1/bulk/products/adjust-properties
Body Params
ids
Array <string>
Required
minItems 1
maxItems 100
Product IDs.

adjust
Adjust
Numerical property to adjust.

Show Child Properties
Response Object
results
Array <BulkProductResult>
Bulk action results.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Request
cURL
curl -X POST \
  https://www.wixapis.com/stores/v1/bulk/products/adjust-properties \
  -H 'Authorization: <AUTH>'
  -H 'Content-Type: application/json' \
  --data-binary '{
    "ids": [
      "bfcafbe6-b671-4ebe-8e3d-49f242cef188",
      "e5419878-8284-4f02-98bb-087e1d8dc781"
    ],
    "adjust": {
      "price": {
        "percentage": {
          "roundToInt": false,
          "rate": 200
        }
      }
    }
  }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "bfcafbe6-b671-4ebe-8e3d-49f242cef188",
        "originalIndex": 0,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "e5419878-8284-4f02-98bb-087e1d8dc781",
        "originalIndex": 1,
        "success": true
      }
    }
  ],
  "bulkActionMetadata": {
    "totalSuccesses": 2,
    "totalFailures": 0,
    "undetailedFailures": 0
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
Collection Changed
Triggered when a collection is changed.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
collection_Id
string
Collection ID (generated automatically by the catalog).

changedFields
Array <string>
List of collection fields that were changed.

originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.CollectionChanged",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Collection Changed
JSON
{
  "collectionId": "6547efe0-3dc4-bd30-3042-c71427ff2589",
  "changedFields": ["name"]
}
Did this help?

Yes

No
Collection Created
Triggered when a collection is created.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
collection_Id
string
Collection ID (generated automatically by the catalog).

name
string
Collection name.

media
Media
Media items (images, videos, etc.) associated with this collection.

Show Child Properties
slug
string
Collection slug

visible
boolean
Collection visible status

originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.CollectionCreated",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Collection Created
JSON
{
  "collectionId": "1044e7e4-37d1-0705-c5b3-623baae212fd",
  "name": "My collection",
  "slug": "my-collection",
  "visible": true,
  "media": {
    "mainMedia": {
      "thumbnail": {
        "url": "https://static.wixstatic.com/media/bc001baa4397444f809fa5f147c28a9e.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
        "width": 50,
        "height": 50
      },
      "mediaType": "image",
      "title": "",
      "image": {
        "url": "https://static.wixstatic.com/media/bc001baa4397444f809fa5f147c28a9e.jpg/v1/fit/w_1920,h_1280,q_90/file.jpg",
        "width": 1920,
        "height": 1280
      },
      "id": ""
    },
    "items": [
      {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/bc001baa4397444f809fa5f147c28a9e.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/bc001baa4397444f809fa5f147c28a9e.jpg/v1/fit/w_1920,h_1280,q_90/file.jpg",
          "width": 1920,
          "height": 1280
        },
        "id": ""
      }
    ]
  }
}
Did this help?

Yes

No
Collection Deleted
Triggered when a collection is deleted.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
collection_Id
string
ID of the collection that was deleted.

originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.CollectionDeleted",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Collection Deleted
JSON
{
  "collectionId": "135101-thisIs-135101-someId"
}
Did this help?

Yes

No
Product Changed
Triggered when a product is changed.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
productId
string
Product ID.

changedFields
Array <string>
List of product fields that were changed.

originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.ProductChanged",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Product Changed
JSON
{
  "productId": "a60fef92-ee29-070f-a7ed-9bbc3cc1c2f4",
  "changedFields": ["priceData"]
}
Did this help?

Yes

No
Product Created
Triggered when a product is created.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
productId
string
Product ID (generated automatically by the catalog).

name
string
Product name.

price
Price
Product price.

Show Child Properties
visible
boolean
Whether the product is visible to customers.

media
Media
Media items (images, videos, etc.) associated with this product.

Show Child Properties
sku
string
Product stock keeping unit (SKU). If variants are being managed, this will be empty.

productPageUrl
ProductPageUrl
Product page URL for this product (generated automatically by the server).

Show Child Properties
brand
string
Product brand.

costAndProfitData
CostAndProfitData
Cost and profit data

Show Child Properties
originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
slug
string
Event slug. A human readable identifier of the event.

Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.ProductCreated",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Product Created
JSON
{
  "productId": "6693f74a-2a79-0bb7-00ef-2b8581bc8757",
  "name": "my product",
  "priceData": {
    "currency": "USD",
    "price": 32,
    "discountedPrice": 30.4,
    "formatted": {
      "price": "32.00 ₪",
      "discountedPrice": "30.40 ₪"
    }
  },
  "visible": true,
  "media": {
    "mainMedia": {
      "thumbnail": {
        "url": "https://static.wixstatic.com/media/689fa9dd0c7f47d4b45a0b78afccdc8a.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
        "width": 50,
        "height": 50
      },
      "mediaType": "image",
      "title": "",
      "image": {
        "url": "https://static.wixstatic.com/media/689fa9dd0c7f47d4b45a0b78afccdc8a.jpg/v1/fit/w_5760,h_3840,q_90/file.jpg",
        "width": 5760,
        "height": 3840
      },
      "id": "689fa9dd0c7f47d4b45a0b78afccdc8a.jpg"
    },
    "items": [
      {
        "thumbnail": {
          "url": "https://static.wixstatic.com/media/689fa9dd0c7f47d4b45a0b78afccdc8a.jpg/v1/fit/w_50,h_50,q_90/file.jpg",
          "width": 50,
          "height": 50
        },
        "mediaType": "image",
        "title": "",
        "image": {
          "url": "https://static.wixstatic.com/media/689fa9dd0c7f47d4b45a0b78afccdc8a.jpg/v1/fit/w_5760,h_3840,q_90/file.jpg",
          "width": 5760,
          "height": 3840
        },
        "id": "689fa9dd0c7f47d4b45a0b78afccdc8a.jpg"
      }
    ]
  },
  "sku": "38473",
  "productPageUrl": {
    "base": "https://my-website.com",
    "path": "/product-page/my-product"
  }
}
Did this help?

Yes

No
Product Deleted
Triggered when a product is deleted.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
productId
string
ID of the product that was deleted.

originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.ProductDeleted",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Product Deleted
JSON
{
  "productId": "135101-thisIs-135101-someId"
}
Did this help?

Yes

No
Variants Changed
Triggered when a product variant is changed.

Permissions
Read Products
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
productId
string
Product ID.

variants
Array <VariantChanged>
List of variants that were changed.

Show Child Properties
originatedFromVersion
string
Information about the version of the catalog from where this event was triggered.

Show Enum Values
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "com.wix.ecommerce.catalog.api.v1.VariantsChanged",
    "instanceId": "<app-instance-id>",
    "data": "<stringified-JSON>",
    // The identity field is sent as a stringified JSON
    "identity": {
      "identityType": "<identityType>", // ANONYMOUS_VISITOR, MEMBER, WIX_USER, APP
      "anonymousVisitorId": "<anonymousVisitorId>", // in case of ANONYMOUS_VISITOR
      "memberId": "<memberId>", // in case of MEMBER
      "wixUserId": "<wixUserId>", // in case of WIX_USER
      "appId": "<appId>" // in case of APP
    }
  }
}

Sample Data Shown:
Variants Changed
JSON
{
  "productId": "7e4f023f-53d2-70da-30bb-31662b3c095f",
  "variants": [
    {
      "variantId": "00000000-0000-0002-0005-918e4641acb0",
      "choices": { "Size": "large" },
      "changedFields": ["sku", "price"]
    },
    {
      "variantId": "00000000-0000-0001-0005-918e4641acb0",
      "choices": { "Size": "small" },
      "changedFields": ["sku", "price"]
    },
    {
      "variantId": "00000000-0000-0004-0005-918e4641acb0",
      "choices": { "Size": "mySize" },
      "changedFields": ["sku"]
    }
  ]
}