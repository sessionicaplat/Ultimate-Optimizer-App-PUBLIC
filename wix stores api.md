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


  About the Wix Stores Catalog V3
The Wix Stores Catalog V3 is a comprehensive suite of APIs that revolutionizes how developers manage and interact with Wix Stores product catalogs. This next-generation catalog system provides a robust, scalable foundation for building sophisticated e-commerce applications with advanced product management capabilities.

Before you begin
It's important to note the following before starting to code:

Each site supports either Catalog V1 or Catalog V3, but not both at the same time. Use the Catalog Versioning API to determine the API version of a given site.
When you create a new dev site to test your app on, the dev site supports Catalog V3.
If your app currently utilizes the Catalog V1 API, there are several important considerations:
Catalog V3 will initially be rolled out to new users only.
To continue supporting both new and existing users, your app will need to support both Catalog V1 and Catalog V3. You must confirm compatibility in your app's dashboard for Wix users to install your app.
Over time, Catalog V3 will fully replace Catalog V1.
Learn more about migrating from Catalog V1 to Catalog V3.
Catalog V3 services
Catalog V3 provides a comprehensive suite of specialized services, each designed to handle specific aspects of product catalog management:

Products V3
The core service for managing product information, variants, and basic product operations.

Key capabilities:

Product lifecycle management - Create, update, delete, and query products with full variant support.
Advanced variant handling - Manage complex product variations with options, choices, and pricing.
Media management - Associate images, videos, and other media with products and product option choices.
Bulk operations - Efficiently manage large product catalogs with bulk create, update, and delete operations.
Search and filtering - Powerful query capabilities with flexible filtering and sorting.
Product relationships - Manage product collections, cross-sells, and related product associations
Use Cases: Product catalog management, inventory synchronization, product import/export workflows, storefront product display

Inventory Items V3
Dedicated service for sophisticated inventory tracking and stock management.

Key capabilities:

Real-time stock tracking - Monitor inventory levels with automatic updates and availability calculations.
Preorder and backorder management - Handle out-of-stock scenarios with flexible availability policies.
Bulk inventory operations - Efficiently update inventory across large product catalogs.
Use Cases: Warehouse management, dropshipping workflows, multi-location retail, inventory forecasting

Customizations V3
Enables rich product personalization and customization workflows for enhanced customer experiences.

Key capabilities:

Product personalization - Allow customers to customize products with text, images, and design elements.
Dynamic pricing - Adjust prices based on customization choices and complexity.
Flexible input types - Support various customization inputs (text, images, colors, measurements).
Customization templates - Create reusable customization patterns for product families.
Validation rules - Ensure customizations meet business requirements and constraints
Use Cases: Print-on-demand products, personalized gifts, custom apparel, bespoke manufacturing

Info Sections V3
Manages additional product information sections for enhanced product descriptions and specifications.

Key capabilities:

Rich content sections - Create detailed product information with various content types.
Reusable content blocks - Share common information across multiple products.
Structured data - Organize product specifications, features, and technical details.
Content templates - Standardize product information across product categories.
Multi-language support - Provide localized product information for global markets
Use Cases: Technical specifications, size charts, care instructions, warranty information, detailed product descriptions

Brands V3
Comprehensive brand management system for organizing products by manufacturer or brand identity.

Key capabilities:

Brand profiles - Create detailed brand information with logos, descriptions, and metadata.
Brand associations - Link products to brands with automatic organization and filtering.
Brand templates - Standardize brand presentation across products.
Use Cases: Multi-brand retail, brand catalog organization, brand-based marketing campaigns, retailer partnerships

Ribbons V3
Flexible system for product badges, labels, and promotional highlighting.

Key capabilities:

Promotional badges - Create "Sale", "New", "Featured", and custom promotional labels.
Visual customization - Control ribbon appearance, colors, and positioning.
Bulk ribbon management - Apply ribbons to multiple products with filtering and targeting.
Use Cases: Promotional campaigns, seasonal sales, new product launches, inventory clearance, product highlighting

Stores Locations V3
Manages physical and virtual store locations for inventory and fulfillment operations.

Key capabilities:

Location management - Create and manage store locations, warehouses, and fulfillment centers.
Location-based inventory - Track inventory levels specific to each location.
Service areas - Define delivery and service areas for each location.
Use Cases: Multi-location retail, regional inventory management, local delivery services, pickup locations

Categories
External service providing sophisticated category management that integrates seamlessly with Catalog V3.

Key capabilities:

Hierarchical categories - Create nested category structures with unlimited depth.
Category relationships - Manage parent-child relationships and category associations.
Category metadata - Add descriptions, images, and SEO data to categories.
Multi-category assignment - Assign products to multiple categories simultaneously.
Category-based navigation - Enable structured browsing and filtering
Use Cases: Product organization, storefront navigation, catalog browsing, taxonomic product classification

Catalog V1 to V3 Conversion Guide
This guide aims to assist developers in migrating from the Stores Catalog V1 API to the V3 API. It outlines key changes in the product object structure and provides detailed conversion tables for various components.

Important:
To ensure that new and existing sites can install your app, your app must support both Catalog V3 and Catalog V1. You must confirm compatibility in your app's dashboard for Wix users to install your app.

New apps that don't support both versions won't be listed in the app market. Existing apps that don't support both versions won't work on new sites.

Major Changes
Product to Variant Field Relocation: Several fields have moved from the product level to the variant level, including actual price and compare at price. This change allows for more granular control per variant.
Universal Variants: Every product now has at least one variant. Products without options are treated as 'single variant products'.
Variant Management: The manageVariants field has been removed. All products now have variants:
Products without options are considered single variant products
Products with at least one option (equivalent to managedVariants: true in V1) may have multiple variants
Discount Replacement: The discount field has been replaced by the actual price field at the variant level.
Price Data Changes: priceData and convertedPriceData are no longer available.
Options and Customizations: The new Customizations V3 API manages both options and modifiers:
Customization V3 options type are equivalent to V1 options with managedVariants: true
Customization V3 modifiers type are equivalent to V1 options with managedVariants: false
Custom Text Fields: These have been moved to the Customizations modifier type
Some fields previously accessible via the Catalog V1 Product object are now available through other Catalog V3 APIs. On the other hand, some fields that required separate API calls in V1 are now directly available in the Products V3 API.

Conversion Tables
*Fields marked with an asterisk signify little to no change in semantics or access.

Product Object Conversion
Product V1	Product V3	Notes
id*	id	The $hasSome operator for filtering by product.id is not supported in V3.
name*	name	
slug*	slug	
visible*	visible	
productType	productType	Enum values in V3 are in UPPER_CASE
description	description (recommended) OR plainDescription (if integration with RICOS isn't possible)	
sku	variantsInfo.variants[i].sku	For single variant product only. Each variant in V3 can have its own SKU
weight	variantsInfo.variants[i].physicalProperties.weight	For single variant product only. Each variant in V3 can have its own weight
weightRange.minValue	physicalProperties.shippingWeightRange.minValue	
weightRange.maxValue	physicalProperties.shippingWeightRange.maxValue	
stock.trackInventory	Available via Inventory Items API	Each variant in V3 can have its own inventory. Search Inventory Items and filter by productId and/or variantId.
stock.quantity	Available via Inventory Items API	Each variant in V3 can have its own inventory. Search Inventory Items and filter by productId and/or variantId.
stock.inventoryStatus	inventory.availabilityStatus	
priceData.currency	currency	Now a requested field
priceData.price	variantsInfo.variants[i].price.compareAtPrice.amount	See point (5) in Major Changes section above
priceData.discountedPrice	variantsInfo.variants[i].price.actualPrice.amount	See point (5) in Major Changes section above
priceData.formatted.price	variantsInfo.variants[i].price.compareAtPrice.formattedAmount	See point (5) in Major Changes section above
priceData.formatted.discountedPrice	variantsInfo.variants[i].price.actualPrice.formattedAmount	See point (5) in Major Changes section above
priceData.formatted.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.description	See point (5) in Major Changes section above
priceData.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.value	See point (5) in Major Changes section above
convertedPriceData.currency	currency	Now a requested field
convertedPriceData.price	variantsInfo.variants[i].price.compareAtPrice.amount	For single variant product only. Each variant in V3 can have its own compare at price
convertedPriceData.discountedPrice	variantsInfo.variants[i].price.actualPrice.amount	For single variant product only. Each variant in V3 can have its own actual price
convertedPriceData.formatted.price	variantsInfo.variants[i].price.compareAtPrice.formattedAmount	For single variant product only.
convertedPriceData.formatted.discountedPrice	variantsInfo.variants[i].price.atualPrice.formattedAmount	For single variant product only.
convertedPriceData.formatted.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.description	For single variant product only.
convertedPriceData.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.value	For single variant product only.
priceRange.minValue	compareAtPriceRange.minValue.amount	
priceRange.maxValue	compareAtPriceRange.maxValue.amount	
costAndProfitData.itemCost	variantsInfo.variants[i].revenueDetails.cost.amount	For single variant product only.
costAndProfitData.formattedItemCost	variantsInfo.variants[i].revenueDetails.cost.formattedAmount	For single variant product only.
costAndProfitData.profit	variantsInfo.variants[i].revenueDetails.profit.amount	For single variant product only.
costAndProfitData.formattedProfit	variantsInfo.variants[i].revenueDetails.profit.formattedAmount	For single variant product only.
costAndProfitData.profitMargin	variantsInfo.variants[i].revenueDetails.profitMargin	For single variant product only.
costRange.minValue	costRange.minValue.amount	
costRange.maxValue	costRange.maxValue.amount	
pricePerUnitData.totalQuantity	variantsInfo.variants[i].physicalProperties.pricePerUnit.settings.quantity	
pricePerUnitData.totalMeasurementUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.settings.measurementUnit	
pricePerUnitData.baseQuantity	physicalProperties.pricePerUnit.quantity	
pricePerUnitData.baseMeasurementUnit	physicalProperties.pricePerUnit.measurementUnit	
additionalInfoSections[i].title	infoSections[i].title	
additionalInfoSections[i].description	infoSections[i].description (recommended) OR infoSections[i].plainDescription (if integration with RICOS isn't possible)	
media.mainMedia	media.main	See media table
media.items[i]	media.itemsInfo.items[i]	
customTextFields[i].title	modifiers[i].freeTextSettings.title	Manage these fields with the Customizations API
customTextFields[i].maxLength	modifiers[i].freeTextSettings.maxCharCount	Manage these fields with the Customizations API
customTextFields[i].mandatory	modifiers[i].mandatory	Manage these fields with the Customizations API
manageVariants	-	See point (3) in Major Changes section above
productOptions[i].optionType and manageVariants = true	options[i].optionRenderType	
productOptions[i].optionType and manageVariants = false	modifiers[i].modifierRenderType	
productOptions[i].name and manageVariants = true	options[i].name	
productOptions[i].name and manageVariants = false	modifiers[i].name	
productOptions[i].choices[i].value and manageVariants = true	options[i].choicesSettings.choices[i]	
productOptions[i].choices[i].value and manageVariants = false	modifiers[i].choicesSettings.choices	
productOptions[i].choices[i].description and manageVariants = true	options[i].choicesSettings.choices[i].name	
productOptions[i].choices[i].description and manageVariants = false	modifiers[i].choicesSettings.choices[i].name	
productOptions[i].choices[i].media and manageVariants = true	options[i].choicesSettings.choices[i].linkedMedia[i]	See media table
productOptions[i].choices[i].media and manageVariants = false	modifiers[i].choicesSettings.choices[i].linkedMedia[i]	See media table
productOptions[i].choices[i].inStock	options[i].choicesSettings.choices[i].inStock	
productOptions[i].choices[i].visible	options[i].choicesSettings.choices[i].visible	
productPageUrl.base	url.url	Must be a full URL
productPageUrl.path	url.relativePath	
numericId	Was used for cursor paging - V3 Query & Search APIs support cursor paging out of the box	
inventoryItemId	Available via Inventory Items API	Moved to inventory service but it's no longer saved on Product V3. Search Inventory Items and filter by productId and/or variantId.
discount.type	variantsInfo.variants[i].price.actualPrice.amount	Discounts now saved on each variant
discount.value	variantsInfo.variants[i].price.actualPrice.amount	Discounts now saved on each variant
collectionIds[i]	directCategories[i].id	
variants[i].id	variantsInfo.variants[i].id	
variants[i].choices[key]	variantsInfo.variants[i].choices[i].optionChoiceNames.optionName	
variants[i].choices[value]	variantsInfo.variants[i].choices[i].optionChoiceNames.choiceName	
variants[i].variant.priceData	-	See point (5) in Major Changes section above
variants[i].variant.convertedPriceData.price	variantsInfo.variants[i].price.compareAtPriceRange.amount	
variants[i].variant.convertedPriceData.discountedPrice	variantsInfo.variants[i].price.actualPrice.amount	
variants[i].variant.convertedPriceData.formatted.price	variantsInfo.variants[i].price.compareAtPriceRange.formattedAmount	
variants[i].variant.convertedPriceData.formatted.discountedPrice	variantsInfo.variants[i].price.actualPrice.formattedAmount	
variants[i].variant.convertedPriceData.formatted.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.description	
variants[i].variant.convertedPriceData.pricePerUnit	variantsInfo.variants[i].physicalProperties.pricePerUnit.value	
variants[i].variant.costAndProfitData.itemCost	variantsInfo.variants[i].revenueDetails.cost.amount	
variants[i].variant.costAndProfitData.formattedItemCost	variantsInfo.variants[i].revenueDetails.cost.formattedAmount	
variants[i].variant.costAndProfitData.profit	variantsInfo.variants[i].revenueDetails.profit.amount	
variants[i].variant.costAndProfitData.formattedProfit	variantsInfo.variants[i].revenueDetails.profit.formattedAmount	
variants[i].variant.costAndProfitData.profitMargin	variantsInfo.variants[i].revenueDetails.profitMargin	
variants[i].variant.weight	variantsInfo.variants[i].physicalProperties.weight	
variants[i].variant.sku	variantsInfo.variants[i].sku	
variants[i].variant.visible	variantsInfo.variants[i].visible	
variants[i].stock.trackQuantity	Available via Inventory Items API	
variants[i].stock.quantity	Available via Inventory Items API	
variants[i].stock.inStock	variantsInfo.variants[i].inventoryStatus.inStock	
lastUpdated	updatedDate	
createdDate	createdDate	
seoData*	seoData	
ribbon	ribbon.name	Manage these fields with the Ribbons API
brand	brand.name	Manage these fields with the Brands API
taxGroupId	taxGroupId	
digitalFile.id	variantsInfo.variants[i].digitalProperties.digitalFile.id	Each variant in V3 can have its own digital file
digitalFile.fileName	variantsInfo.variants[i].digitalProperties.digitalFile.fileName	Each variant in V3 can have its own digital file
digitalFile.fileType	variantsInfo.variants[i].digitalProperties.digitalFile.fileType	Each variant in V3 can have its own digital file
*Fields marked with an asterisk signify little to no change in semantics or access.

Media Conversion Table
Media V1	Media V3
thumbnail.url	-
thumbnail.width	-
thumbnail.height	-
thumbnail.format	-
thumbnail.altText	-
mediaType	-
title and mediaType = IMAGE	image.fileName
title and mediaType = VIDEO	video.filename
id and mediaType = IMAGE	image.id
id and mediaType = VIDEO	video.id
image.url*	image.url
image.width*	image.width
image.height*	image.height
image.format	-
image.altText*	image.altText
video.files[i].url	video.resolutions[i].url
video.files[i].width	video.resolutions[i].width
video.files[i].height	video.resolutions[i].height
video.files[i].format	video.resolutions[i].format
video.files[i].altText	-
video.stillFrameMediaId	-
Inventory Conversion Table
Inventory V2	Inventory Items V3	Notes
id*	id	
productId*	productId	
trackQuantity	trackQuantity	Now on the variant level
variants[i].variantId	variantId	
variants[i].inStock	trackingMethod.inStock	
variants[i].quantity	trackingMethod.quantity	
variants[i].availableForPreorder	AvailabilityStatus = PREORDER	
lastUpdated	updatedDate	
numericId	-	Was used for cursor paging - V3 Query & Search APIs support cursor paging out of the box
preorderInfo.enabled	preorderInfo.enabled	
preorderInfo.message	preorderInfo.message	
preorderInfo.limit	preorderInfo.limit	
Subscriptions Conversion Table
In V1 Subscriptions has its own APIs, where in V3 we don't have a dedicated API. Subscriptions exists directly in Product entity.

SubscriptionOption V1	Product V3
id	subscriptionDetails.subscriptions[i].id
title	subscriptionDetails.subscriptions[i].title
description	subscriptionDetails.subscriptions[i].description
subscriptionSettings.frequency	subscriptionDetails.subscriptions[i].frequency
subscriptionSettings.interval	subscriptionDetails.subscriptions[i].interval
subscriptionSettings.autoRenewal	subscriptionDetails.subscriptions[i].autoRenewal
subscriptionSettings.billingCycles	subscriptionDetails.subscriptions[i].billingCycles
discount.type	subscriptionDetails.subscriptions[i].discount.type
discount.value	subscriptionDetails.subscriptions[i].discount.amountOff OR subscriptionDetails.subscriptions[i].discount.percentOff
SubscriptionOptionInProduct V1	Product V3
id	subscriptionDetails.subscriptions[i].id
hidden	subscriptionDetails.subscriptions[i].visible
title	subscriptionDetails.subscriptions[i].title
description	subscriptionDetails.subscriptions[i].description
subscriptionSettings.frequency	subscriptionDetails.subscriptions[i].frequency
subscriptionSettings.interval	subscriptionDetails.subscriptions[i].interval
subscriptionSettings.autoRenewal	subscriptionDetails.subscriptions[i].autoRenewal
subscriptionSettings.billingCycles	subscriptionDetails.subscriptions[i].billingCycles
discount.type	subscriptionDetails.subscriptions[i].discount.type
discount.value	subscriptionDetails.subscriptions[i].discount.amountOff OR subscriptionDetails.subscriptions[i].discount.percentOff
Webhook Conversion Table
The following table shows Catalog V1 webhooks and their equivalents in Catalog V3 that are triggered at the same time:

Catalog V1	Catalog V3
Product Created	Product Created
Product Changed	Product Updated
Product Deleted	Product Deleted
Variants Changed	Product Updated variantsInfo will be included in modifiedFields
Collection Created	Category Created
Collection Changed	Category Updated
Collection Deleted	Category Deleted
We've updated the structure of the webhook/event payload. The product ID is now provided both at the top level as entityId and as product.id within the payload itself. The table below describes where to find the product ID or product entity in the new webhook payloads:

Catalog V1 Webhooks	Catalog V3 Webhooks
productId, collectionId, variants.variantId	All webhook payloads - entityId
Product Changed - changedFields	modifiedFields
Product/Collection Created entity data	createdEvent.entityAsJson
For more detailed information on specific field changes and how to access data in the new API structure, please refer to our API documentation.


eCommerce Integration with Wix Stores Catalog V3
When integrating products from your Wix Stores catalog into an eCommerce cart, checkout, or order, you must use the catalogReference object structure. This guide explains how to properly format and use the catalogReference object in various eCommerce API functions.

Pass the catalogReference object as part of the lineItems array in the following eCommerce API functions:

Create Cart and Add To Cart
Create Checkout and Add To Checkout
Create Order
Catalog Reference Object Structure
The catalogReference object includes the following fields:

eCommerce	Stores Catalog
catalogItemId	The productId of the Wix Stores product
appId	The Wix Stores app ID (always "215238eb-22a5-4c36-9e7b-e7c08025e04e")
options	An optional object containing product-specific key-value pairs
Copy
{
  "catalogItemId": "<productId>",
  "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
  "options": {
    "variantId": "<variantsInfo.variants.id>",
    "options": {
      "<modifiers.key>": "<modifiers.choicesSettings.choices.key>"
    },
    "customTextFields": {
      "<modifiers.freeTextSettings.key>": "<user input>"
    },
    "subscriptionOptionId": "<subscriptionDetails.subscriptions.id>"
  }
}
Important Notes
Use modifiers in either options or customTextFields based on the modifierRenderType:
For TEXT_CHOICES, use the modifier and choice key in options.
For FREE_TEXT, use the freeTextSettings.key in customTextFields.
You may omit customTextFields and options in catalogReference if the related modifier is not mandatory.
You can omit subscriptionOptionId if the product doesn't have subscriptionDetails defined or when subscriptionDetails.allowOneTimePurchases is true.
Always include the variantId.
Example
Consider a product with the following structure:

Copy
{
  "product": {
    "id": "dc765ec4-eaf0-4253-8ba7-e752c227d4ca",
    "name": "Coffee",
    "options": [
      {
        "id": "093b7310-b96e-4ed5-927d-84f7de0f62be",
        "name": "Size",
        "optionRenderType": "TEXT_CHOICES",
        "choicesSettings": {
          "choices": [
            {
              "choiceId": "bd2402d9-4ff2-42d0-b902-db235c132b0d",
              "name": "S"
            },
            {
              "choiceId": "a75b02ff-6477-445a-a815-0e2a64edd076",
              "name": "L"
            }
          ]
        }
      },
      {
        "id": "480901ba-9144-475b-a461-bd8f7cb6528d",
        "name": "Box color",
        "optionRenderType": "SWATCH_CHOICES",
        "choicesSettings": {
          "choices": [
            {
              "choiceId": "85f6eae5-967a-4752-ab5d-71a8b8c84bf7",
              "name": "Red"
            },
            {
              "choiceId": "11138ea7-a367-4053-b84f-d6065f2ac046",
              "name": "Blue"
            }
          ]
        }
      }
    ],
    "modifiers": [
      {
        "name": "Engraving",
        "modifierRenderType": "FREE_TEXT",
        "mandatory": false,
        "freeTextSettings": {
          "title": "Would you like to engrave something on the box?",
          "key": "Would you like to engrave something on the box?"
        }
      },
      {
        "name": "Remove price tag",
        "modifierRenderType": "TEXT_CHOICES",
        "mandatory": false,
        "choicesSettings": {
          "choices": [
            {
              "key": "yes",
              "name": "Yes"
            },
            {
              "key": "no",
              "name": "No"
            }
          ]
        },
        "key": "Remove price tag"
      }
    ],
    "variantsInfo": {
      "variants": [
        {
          "id": "9650a809-5567-44f7-9435-cf77a38cb170",
          "optionChoiceIds": [
            {
              "optionId": "093b7310-b96e-4ed5-927d-84f7de0f62be",
              "choiceId": "bd2402d9-4ff2-42d0-b902-db235c132b0d"
            },
            {
              "optionId": "480901ba-9144-475b-a461-bd8f7cb6528d",
              "choiceId": "85f6eae5-967a-4752-ab5d-71a8b8c84bf7"
            }
          ]
        },
        {
          "id": "02f13ad1-40f1-4108-ae2e-9f48e17dfea7",
          "optionChoiceIds": [
            {
              "optionId": "093b7310-b96e-4ed5-927d-84f7de0f62be",
              "choiceId": "a75b02ff-6477-445a-a815-0e2a64edd076"
            },
            {
              "optionId": "480901ba-9144-475b-a461-bd8f7cb6528d",
              "choiceId": "11138ea7-a367-4053-b84f-d6065f2ac046"
            }
          ]
        }
      ]
    },
    "subscriptionDetails": {
      "subscriptions": [
        {
          "id": "3c750e1e-54fd-4fe0-8844-97427522c939",
          "title": "Monthly Subscription",
          "visible": true,
          "frequency": "MONTH",
          "interval": 1,
          "autoRenewal": true
        }
      ],
      "allowOneTimePurchases": true
    }
  }
}
Note: many product fields in the above example have been omitted for conciseness.

Scenario
A buyer wants to purchase "Coffee" with the following options:

Size: S
Box color: Red
Remove price tag: Yes
Engraving: "For my best friend! :)"
Delivery: Monthly subscription
Resulting catalogReference object
Copy
{
  "catalogItemId": "dc765ec4-eaf0-4253-8ba7-e752c227d4ca",
  "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
  "options": {
    "variantId": "9650a809-5567-44f7-9435-cf77a38cb170",
    "options": {
      "Remove price tag": "Yes"
    },
    "customTextFields": {
      "Would you like to engrave something on the box?": "For my best friend! :)"
    },
    "subscriptionOptionId": "3c750e1e-54fd-4fe0-8844-97427522c939"
  }
}
To find the correct variantId, match the options.id and options.choicesSettings.choices.choiceId of the buyer's selected options with variantsInfo.variants.optionChoiceIds.optionId and variantsInfo.variants.optionChoiceIds.optionId in the variants.

Minimal valid catalogReference object
Since both modifiers have "mandatory": false and subscriptionDetails.allowOneTimePurchases is true, the following minimal catalogReference is also valid:

Copy
{
  "catalogItemId": "dc765ec4-eaf0-4253-8ba7-e752c227d4ca",
  "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e",
  "options": {
    "variantId": "9650a809-5567-44f7-9435-cf77a38cb170"
  }
}
About Products
The Products API allows you to create and manage a store's products.

With the products API you can:

Create and Bulk Create Products
Update and Bulk Update Products
Delete and Bulk Delete Products
Get, Search, Query, and Count Products
Bulk Update Variants
Bulk Add and Bulk Remove Products From Categories
And more
Before you begin
It’s important to note the following points before starting to code:

The site owner must install the Wix Stores app.
Sample flows
Add and arrange products in category
Prepare store for Christmas Sale
Extend product object with app specific fields
Did this help?

Yes

No
Sample Use Cases and Flows
This article shares a possible use case your app could support, as well as sample flows that could support this use case. This can be a helpful jumping-off point as you plan your app's implementation.

Add and arrange products in category
Help merchants to manage their products by using categories. For this we will be using the Categories API.

Call Create Category and pass "@wix/stores" to the treeReference.appNamespace field.
Save category.id from the response.
Call Bulk Add Items To Category and pass the items you want to add to the category. After products added to category you can rearrange them for example to promote some products to be displayed in the beginning. Note that you can arrange only 100 products, more products can be added but you cannot control arrangement of them. Call Set Arranged Items endpoint. Pass exactly same params as in step 2 but now items must be in same order in which you want to see them.
Now you can load all products that belongs to given category and keep their arrangement by calling Search Products endpoint of ProductService with next body
Copy
{
  "search": {
    "sort": [
      {
        "selectItemsBy": [
          {
            "directCategoriesInfo.categories.id": "<categoryId>"
          }
        ],
        "fieldName": "directCategoriesInfo.categories.index",
        "order": "ASC"
      }
    ],
    "filter": {
      "directCategoriesInfo.categories": {
        "$matchItems": [
          {
            "id": "<categoryId>"
          }
        ]
      }
    }
  }
}
Replace <categoryId> with real category id from step 1. Pay attention to sort.selectItemsBy parameter where you must pass filter by categoryId, this allows you to sort products by arrangement that you set in CategoriesService on step 3.

Prepare store for Christmas Sale
Before big sale merchant might want to prepare store by creating a new category for products on sale, adding ribbons to products to catch visitors' attention and of course setting new actual prices and compare at prices. Let's see how to do it step by step.

Add and arrange products in category. This will allow visitor to filter by this category on storefront category page (if merchant enabled this filter in editor). Also it allows merchant to control which products visitor will see first.
Create new ribbon by calling Create Ribbon endpoint of external RibbonService. Save ribbon.id that you received in response.
To add ribbon "Sale!" to all products in category call Bulk Update Products By Filter endpoint. In filter send filter by category id. In product send only ribbon. So your request will look like:
Copy
{
  "filter": {
    "directCategoriesInfo.categories.id": "<categoryId>"
  },
  "product": {
    "ribbon": {
      "id": "<ribbonId>"
    }
  }
}
Finally, we need to update the actual prices and compare-at prices. To simplify, consider a single product with one variant where the actualPrice is set at $100.
First we want to set a new compareAtPrice, this price will indicate to your client what is the price of the product before the sale. call Bulk Update Product Variants By Filter endpoint with variant with desired compareAtPrice and actualPrice:
Copy
{
  "variant": {
    "price": {
      "compareAtPrice": {
        "amount": "100"
      },
      "actualPrice": {
        "amount": "90"
      }
    }
  }
}
After this call example product will have compareAtPrice 100$ and actualPrice 90$.

a) If you want to adjust all actual prices by some specific amount or percentage which depends on original actualPrice value call Bulk Adjust Product Variants By Filter. For example if you want to decrease current actual prices by 10% pass next body:

Copy
{
  "actualPrice": {
    "percentage": -10
  }
}
After this call example product will have compareAtPrice 100$ and actualPrice 81$.

b) If you want to calculate new actualPrice from compareAtPrice by applying some discount to it call Bulk Adjust Product Variants By Filter with actualPriceFromCompareAtPrice. For example if you want to set actualPrice as 20% discount from compareAtPrice pass next body:

Copy
{
  "actualPriceFromCompareAtPrice": {
    "percentage": 20
  }
}
After this call example product will have compareAtPrice 100$ and actualPrice 80$.

c) If you want to set exact actualPrice same for all variants of all products call Bulk Update Product Variants By Filter endpoint with variant with desired actualPrice:

Copy
{
  "variant": {
    "price": {
      "actualPrice": {
        "amount": "75"
      }
    }
  }
}
After this call example product will have compareAtPrice 100$ and actualPrice 75$.

Extend product object with app specific fields
The Product object includes predefined fields that cannot be removed or renamed. However, there may be instances where you need to add additional fields to accommodate specific flows or use cases for your application.

For example, consider a real estate app that needs to store information about the total area and the type of unit (such as whether it is an apartment or a house). This can be achieved using the extendedFields field of the Product object.

Before proceeding, you may want to review our documentation on data extensions or schema plugins here.

Follow this guide to create an extension of type "Stores Catalog Product" in the Dev Center. Be sure to note the namespace of your app, as you will need it for the next steps. For this example, let's assume the namespace is @my-user-name/real-estate-app.
In the JSON Editor, enter the following value:
Copy
{
  "type": "object",
  "properties": {
    "unitType": {
      "type": "string",
      "maxLength": 50,
      "x-wix-permissions": {
        "read": ["owning-app", "users"],
        "write": ["owning-app", "users"]
      }
    },
    "areaInSqm": {
      "type": "integer",
      "minimum": 15,
      "x-wix-permissions": {
        "read": ["owning-app", "users"],
        "write": ["owning-app", "users"]
      }
    }
  }
}
This defines two fields: areaInSqm, which includes minimum value validation, and unitType, which includes maximum length validation. Both fields can be read and written by your app as well as by users, such as the site owner. 3. Save your extension. Please note that, according to this guide, you must have your app approved before you can proceed with testing. 4. Once your app is approved, you can click "Test Your App" and select the site where you want to install it. Be sure to grant the app permissions to read and write to the stores catalog. 5. You can now create a product with extended fields by calling the Create Product endpoint or update an existing product by calling the Update Product endpoint. In your request, include the extendedFields object with your namespace and the relevant field values.

Copy
{
  "product": {
    "id": "e0f16062-2f78-457b-ab47-78847e206e49",
    "revision": 1,
    "name": "Luxury apartment in the city center",
    "extendedFields": {
      "namespaces": {
        "@my-user-name/real-estate-app": {
          "unitType": "apartment",
          "areaInSqm": 120
        }
      }
    }
  }
}
When you call the Get Product endpoint, the response will include the extendedFields object with your namespace.
Did this help?

Yes

No
Stores Products: Supported Filters and Sorting
The following table shows field support for filters and sorting for the SearchProducts endpoint :

Field	Supported Filters	Sortable
id	$eq, $ne, $exists, $in, $startsWith	
handle	$eq, $ne, $exists, $in, $startsWith	
slug	$eq, $ne, $exists, $in, $startsWith	
directCategoriesInfo.categories	$matchItems	
directCategoriesInfo.categories.id	$eq, $ne, $exists, $in, $hasSome, $startsWith	
allCategoriesInfo.categories	$matchItems	
allCategoriesInfo.categories.id	$eq, $ne, $exists, $in, $hasSome, $startsWith	
productType	$eq, $ne, $exists, $in	
inventory.availabilityStatus	$eq, $ne, $exists, $in	
inventory.preorderStatus	$eq, $ne, $exists, $in	
inventory.preorderAvailability	$eq, $ne, $exists, $in	
visible	$eq, $ne, $exists, $in	
visibleInPos	$eq, $ne, $exists, $in	
importId	$eq, $ne, $exists, $in, $startsWith	
modifiers.id	$isEmpty, $hasAll, $hasSome	
modifiers.choicesSettings.choices.choiceId	$isEmpty, $hasAll, $hasSome	
modifiers.choicesSettings.choices.name	$isEmpty, $hasAll, $hasSome	
modifiers.name	$isEmpty, $hasAll, $hasSome	
options.id	$isEmpty, $hasAll, $hasSome	
options.choicesSettings.choices.choiceId	$isEmpty, $hasAll, $hasSome	
options.choicesSettings.choices.name	$isEmpty, $hasAll, $hasSome	
options.name	$isEmpty, $hasAll, $hasSome	
flattenOptions	$isEmpty, $hasAll, $hasSome	
flattenModifiers	$isEmpty, $hasAll, $hasSome	
brand.id	$eq, $ne, $exists, $in, $startsWith	
brand.name	$eq, $ne, $exists, $in, $startsWith	
ribbon.id	$eq, $ne, $exists, $in, $startsWith	
ribbon.name	$eq, $ne, $exists, $in, $startsWith	
infoSections.id	$isEmpty, $hasAll, $hasSome	
infoSections.uniqueName	$isEmpty, $hasAll, $hasSome	
taxGroupId	$eq, $ne, $exists, $in, $startsWith	
physicalProperties.fulfillerId	$eq, $ne, $exists, $in, $startsWith	
physicalProperties.shippingGroupId	$eq, $ne, $exists, $in, $startsWith	
physicalProperties.deliveryProfileId	$eq, $ne, $exists, $in, $startsWith	
variantsInfo.variants	$matchItems	
variantsInfo.variants.visible	$eq, $ne, $exists, $in, $hasSome	
variantsInfo.variants.price.actualPrice.amount	$eq, $ne, $exists, $in, $hasSome, $lt, $lte, $gt, $gte	
variantsInfo.variants.price.compareAtPrice.amount	$eq, $ne, $exists, $in, $hasSome, $lt, $lte, $gt, $gte	
variantsInfo.variants.choices.optionChoiceIds.optionId	$isEmpty, $hasAll, $hasSome	
variantsInfo.variants.choices.optionChoiceIds.choiceId	$isEmpty, $hasAll, $hasSome	
variantsInfo.variants.sku	$eq, $ne, $exists, $in, $hasSome, $startsWith	
variantsInfo.variants.barcode	$eq, $ne, $exists, $in, $hasSome, $startsWith	
variantsInfo.variants.physicalProperties.weight	$eq, $ne, $exists, $in, $hasSome, $lt, $lte, $gt, $gte	
subscriptionDetails.allowOneTimePurchases	$eq, $ne, $exists, $in	
name	$eq, $ne, $exists, $in, $startsWith	Sortable
updatedDate	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
createdDate	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
numericId	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
actualPriceRange.minValue.amount	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
actualPriceRange.maxValue.amount	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
compareAtPriceRange.minValue.amount	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
compareAtPriceRange.maxValue.amount	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
physicalProperties.shippingWeightRange.minValue	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
physicalProperties.shippingWeightRange.maxValue	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
directCategoriesInfo.categories.index	$eq, $ne, $exists, $in, $hasSome, $lt, $lte, $gt, $gte	Sortable
allCategoriesInfo.categories.index	$eq, $ne, $exists, $in, $hasSome, $lt, $lte, $gt, $gte	Sortable
The following table shows field support for filters and sorting for the QueryProducts endpoint :

Field	Supported Filters	Sortable
id	$eq, $ne, $exists, $in, $startsWith	
handle	$eq, $ne, $exists, $in, $startsWith	
options.id	$isEmpty, $hasAll, $hasSome	
slug	$eq, $ne, $exists, $in, $startsWith	Sortable
createdDate	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
updatedDate	$eq, $ne, $exists, $in, $lt, $lte, $gt, $gte	Sortable
visible	$eq, $ne, $exists, $in	Sortable
Related content: API Query Language, Query Store Products, Search Store Products

Did this help?

Yes

No
Product Object
Short description of ProductService

Properties
id
string
Read-only
minLength 1
maxLength 36
immutable
Product ID.

revision
string
Read-only
format int64
Revision number, which increments by 1 each time the product is updated. To prevent conflicting changes, the current revision must be passed when updating the product.

Ignored when creating a product.

createdDate
string
Read-only
format date-time
Date and time the product was created.

updatedDate
string
Read-only
format date-time
Date and time the product was updated.

name
string
minLength 1
maxLength 80
Product name. Translatable.

slug
string
format URL_SLUG
Product slug.

If not provided, the slug is autogenerated based on the product name.

url
Url
Read-only
URL to the site's product page.

Note: Returned only when you pass "URL" to the fields array in Products API requests.

Show Child Properties
description
Description
Product description using rich content.

Note: Returned only when you pass "DESCRIPTION" to the fields array in Products API requests.

This field uses Ricos Document, a structured rich content data format. For a quick start, copy the JSON content from the sample playground below. Learn more about Rich Content (SDK | REST).

Document
Tidy up
Copy
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
{
  "nodes": [
    {
      "id": "foo",
      "type": "HEADING",
      "nodes": [
        {
          "id": "",
          "type": "TEXT",
          "textData": {
            "text": "Wix Stores"
          }
        }
      ],
      "headingData": {
        "level": 2,
        "textStyle": {
          "textAlignment": "AUTO"
        }
      }
    },
    {
      "id": "94hvh101",
      "type": "PARAGRAPH"
    },
    {
      "id": "x193d215",
      "type": "BULLETED_LIST",
      "nodes": [
        {
          "id": "dxzj9216",
          "type": "LIST_ITEM",
          "nodes": [
            {
              "id": "3cw49111",
              "type": "PARAGRAPH",

Document

Viewer

Editor

Note: This API enables the following Ricos plugins :
indent
emoji
divider
codeBlock
file
gallery
giphy
image
table
link
textHighlight
textColor
plainDescription
string
maxLength 16000
Product description in HTML.

When provided on create/update, this string must be a valid HTML. It will then be converted to rich content.
plainDescription is ignored when value is also passed to the description field.
Note: Returned only when you pass "PLAIN_DESCRIPTION" to the fields array in Products API requests.

visible
boolean
Whether the product is visible to site visitors on the site.

Default: true

visibleInPos
boolean
Whether the product is visible in POS (point of sale).

Default: true

Note: Always false for productType: DIGITAL.

media
Media
Product media items.

Show Child Properties
seoData
SeoData
Product SEO data.

Show Child Properties
taxGroupId
string
format GUID
Tax group ID.

options
Array <ConnectedOption>
maxItems 6
Product options. Allows the customer to customize the product. For example, selecting color, size, and more.

Always generates variants: every variant must have exactly one choice related to each option. Since options and variants tightly coupled and rely on each other they usually should be provided together in all operations.

Show Child Properties
modifiers
Array <ConnectedModifier>
maxItems 10
Product modifiers.

Allows the customer to customize product, e.g. select Color, Size and so on similarly to options but with one main difference - modifiers never generate any variants.

Show Child Properties
brand
Brand
Product brand.

Pass brand.name to add a new brand while creating a product.
Pass an existing brand's id to assign that brand to the product.
Show Child Properties
infoSections
Array <InfoSection>
maxItems 10
Product info section.

Pass infoSection.uniqueName, infoSection.title, and infoSection.description to add a new info section while creating a product.
Pass an existing info section's id or uniqueName to assign that info section to the product.
Show Child Properties
ribbon
Ribbon
Product ribbon.

Pass ribbon.name to add a new ribbon while creating a product.
Pass an existing ribbon's id or name to assign that ribbon to the product.
Show Child Properties
directCategoriesInfo
DirectCategoriesInfo
Read-only
List of categories that directly contain this product.

Updated automatically when a product is added/removed from a category, when an item is moved within a category, or when a category is deleted.

Note: Returned only when you pass "DIRECT_CATEGORIES_INFO" to the fields array in Products API requests.

Show Child Properties
allCategoriesInfo
AllCategoriesInfo
Read-only
List of categories that directly contain this product, as well as their parent categories.

Note: Returned only when you pass "ALL_CATEGORIES_INFO" to the fields array in Products API requests.

Show Child Properties
mainCategoryId
string
format GUID

The ID of the product's primary direct category, which defines the product’s breadcrumbs path. For example, if the product's main category is "T-Shirts" (which is a subcategory of "Clothing"), the breadcrumbs path will be "Clothing > T-Shirts".

costRange
CostRange
Read-only
Product cost range - minimum and maximum costs of all product variants.

Note: Returned only when the following conditions are met:

You pass "MERCHANT_DATA" to the fields array in Products API requests.
Your app has the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.
Show Child Properties
inventory
Inventory
Read-only
Product inventory info.

Show Child Properties
productType
string
immutable
Product type.

When passing productType: PHYSICAL, you must also pass physicalProperties.

Show Enum Values
handle
string
Read-only
minLength 1
maxLength 100
A unique human-friendly identifier for the product. Unlike the product ID, the handle can be set by the user to ensure consistency across multiple platforms. In case handle wasn't given, the handle will be automatically generated.

currency
string
Read-only
format CURRENCY
Currency used for the pricing of this product, in ISO-4217 format.

Defaults to the currency defined in the site settings, unless specified in x-wix-currency header.

Note: Returned only when you pass "CURRENCY" to the fields array in Products API requests.

breadcrumbsInfo
BreadcrumbsInfo
Read-only
Breadcrumbs of the mainCategoryId. Used to navigate to parent categories.

Note: Returned only when you pass "BREADCRUMBS_INFO" to the fields array in Products API requests.

Show Child Properties
actualPriceRange
ActualPriceRange
Read-only
Product actualPrice range - minimum and maximum prices of all product variants.

Show Child Properties
compareAtPriceRange
CompareAtPriceRange
Read-only
Product compareAtPrice range - minimum and maximum compare at prices of all product variants.

Show Child Properties
variantsInfo
VariantsInfo
Product variants. Each variant must reference all product options via its choices array. Each choice references an option using optionChoiceNames for all requests.

Show Child Properties
extendedFields
ExtendedFields
Custom extended fields for the product object.

Extended fields must be configured in the app dashboard before they can be accessed with API calls.

Show Child Properties
subscriptionDetails
SubscriptionDetails
Product subscriptions.

Show Child Properties
variantSummary
VariantSummary
Read-only
The total number of variants for the product.

Show Child Properties
physicalProperties
PhysicalProperties
Physical properties.

Required when productType: PHYSICAL.

Show Child Properties
Object Samples:
Product
JSON
{
  "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
  "revision": "2",
  "createdDate": "2024-07-22T13:22:47.771Z",
  "updatedDate": "2024-07-22T13:51:49.970Z",
  "name": "Premium Coffee",
  "slug": "coffee",
  "url": {
    "relativePath": "/product-page/coffee",
    "url": "https://my.wixsite.com/food-store/product-page/coffee"
  },
  "description": {
    "nodes": [
      {
        "type": "PARAGRAPH",
        "id": "foo",
        "nodes": [
          {
            "type": "TEXT",
            "id": "",
            "nodes": [],
            "textData": {
              "text": "Tasty, high quality and eco friendly, in a beautiful gift box.",
              "decorations": []
            }
          }
        ],
        "paragraphData": {
          "textStyle": {
            "textAlignment": "AUTO"
          }
        }
      }
    ],
    "metadata": {
      "version": 1,
      "id": "fb97b2c1-a3ff-4319-be5f-bbb7fdf0776c"
    }
  },
  "plainDescription": "<p>Tasty, high quality and eco friendly, in a beautiful gift box.</p>",
  "visible": false,
  "visibleInPos": false,
  "media": {
    "main": {
      "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
      "image": {
        "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
        "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
        "height": 1200,
        "width": 1200,
        "filename": "food.jpeg",
        "sizeInBytes": "116752"
      },
      "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
    },
    "itemsInfo": {
      "items": [
        {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        {
          "id": "370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
          "image": {
            "id": "370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "44682905-395a-4c18-8fab-e050725ba3f6"
        }
      ]
    }
  },
  "options": [
    {
      "id": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
      "name": "Size",
      "optionRenderType": "TEXT_CHOICES",
      "choicesSettings": {
        "choices": [
          {
            "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd",
            "linkedMedia": [],
            "choiceType": "CHOICE_TEXT",
            "key": "S",
            "name": "S",
            "inStock": true
          },
          {
            "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595",
            "linkedMedia": [],
            "choiceType": "CHOICE_TEXT",
            "key": "L",
            "name": "L",
            "inStock": false
          }
        ]
      },
      "key": "Size"
    },
    {
      "id": "1938d364-126d-4304-b706-9e9e9f6d376f",
      "name": "Box color",
      "optionRenderType": "SWATCH_CHOICES",
      "choicesSettings": {
        "choices": [
          {
            "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60",
            "linkedMedia": [],
            "choiceType": "ONE_COLOR",
            "key": "red",
            "name": "red",
            "colorCode": "#FF0000",
            "inStock": true
          },
          {
            "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6",
            "linkedMedia": [],
            "choiceType": "ONE_COLOR",
            "key": "blue",
            "name": "blue",
            "colorCode": "#0000FF",
            "inStock": false
          }
        ]
      },
      "key": "Box color"
    }
  ],
  "modifiers": [
    {
      "id": "a3d249f0-a8da-425d-9ec1-3c51c795d927",
      "name": "Remove price tag",
      "modifierRenderType": "TEXT_CHOICES",
      "mandatory": false,
      "choicesSettings": {
        "choices": [
          {
            "choiceId": "3050481e-e177-4031-bbe9-be9b00af14b5",
            "linkedMedia": [],
            "choiceType": "CHOICE_TEXT",
            "key": "yes",
            "name": "yes"
          },
          {
            "choiceId": "ee729b74-d500-4594-aae5-b5a2e75bf5e7",
            "linkedMedia": [],
            "choiceType": "CHOICE_TEXT",
            "key": "no",
            "name": "no"
          }
        ]
      },
      "key": "Remove price tag"
    }
  ],
  "brand": {
    "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd",
    "name": "EcoCoffee"
  },
  "infoSections": [
    {
      "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409",
      "uniqueName": "Coffee refund",
      "title": "Refund policy",
      "description": {
        "nodes": [
          {
            "type": "PARAGRAPH",
            "id": "xjkk51429",
            "nodes": [
              {
                "type": "TEXT",
                "id": "",
                "nodes": [],
                "textData": {
                  "text": "2 weeks full refund unless you asked for engraving ",
                  "decorations": []
                }
              }
            ],
            "paragraphData": {}
          }
        ],
        "metadata": {
          "version": 1
        },
        "documentStyle": {}
      },
      "plainDescription": "<p>2 weeks full refund unless you asked for engraving </p>"
    },
    {
      "id": "b9b39003-0edd-41c0-9403-a0fe19cc5bb4",
      "uniqueName": "Origin",
      "title": "Made in",
      "description": {
        "nodes": [
          {
            "type": "PARAGRAPH",
            "id": "xjkk51429",
            "nodes": [
              {
                "type": "TEXT",
                "id": "",
                "nodes": [],
                "textData": {
                  "text": "Brazil",
                  "decorations": []
                }
              }
            ]
          }
        ]
      },
      "plainDescription": "<p>Brazil</p>"
    }
  ],
  "ribbon": {
    "id": "14585597-3302-4145-8da3-24a26d8346d6",
    "name": "New arrival"
  },
  "directCategoriesInfo": {
    "categories": [
      {
        "id": "643721c3-446e-47f3-87ee-0a58d6842d48"
      }
    ]
  },
  "allCategoriesInfo": {
    "categories": [
      {
        "id": "643721c3-446e-47f3-87ee-0a58d6842d48"
      }
    ]
  },
  "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
  "compareAtPriceRange": {
    "minValue": {
      "amount": "10",
      "formattedAmount": "$10.00"
    },
    "maxValue": {
      "amount": "15",
      "formattedAmount": "$15.00"
    }
  },
  "actualPriceRange": {
    "minValue": {
      "amount": "9",
      "formattedAmount": "$9.00"
    },
    "maxValue": {
      "amount": "15",
      "formattedAmount": "$15.00"
    }
  },
  "costRange": {
    "minValue": {
      "amount": "0.0",
      "formattedAmount": "$0.00"
    },
    "maxValue": {
      "amount": "10",
      "formattedAmount": "$10.00"
    }
  },
  "inventory": {
    "availabilityStatus": "OUT_OF_STOCK",
    "preorderAvailability": "NO_VARIANTS",
    "preorderStatus": "DISABLED"
  },
  "productType": "PHYSICAL",
  "physicalProperties": {
    "pricePerUnit": {
      "quantity": 1.0,
      "measurementUnit": "KG"
    },
    "shippingWeightRange": {
      "minValue": 0.2,
      "maxValue": 0.4
    },
    "weightMeasurementUnitInfo": {
      "weightMeasurementUnit": "KG"
    }
  },
  "currency": "USD",
  "breadcrumbsInfo": {
    "breadcrumbs": [
      {
        "categoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
        "categoryName": "All Products",
        "categorySlug": "all-products"
      }
    ]
  },
  "variantsInfo": {
    "variants": [
      {
        "id": "0a186a72-d289-446a-aa51-adf125d30dc6",
        "visible": true,
        "sku": "c-s-r-1111",
        "barcode": "111111111",
        "choices": [
          {
            "optionChoiceIds": {
              "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
              "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
            },
            "optionChoiceNames": {
              "optionName": "Size",
              "choiceName": "S",
              "renderType": "TEXT_CHOICES"
            }
          },
          {
            "optionChoiceIds": {
              "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
              "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
            },
            "optionChoiceNames": {
              "optionName": "Box color",
              "choiceName": "red",
              "renderType": "SWATCH_CHOICES"
            }
          }
        ],
        "price": {
          "compareAtPrice": {
            "amount": "10",
            "formattedAmount": "$10.00"
          },
          "actualPrice": {
            "amount": "9",
            "formattedAmount": "$9.00"
          }
        },
        "revenueDetails": {
          "cost": {
            "amount": "8",
            "formattedAmount": "$8.00"
          },
          "profit": {
            "amount": "1",
            "formattedAmount": "$1.00"
          },
          "profitMargin": 0.1111
        },
        "media": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "physicalProperties": {
          "weight": 0.2,
          "pricePerUnit": {
            "settings": {
              "quantity": 150.0,
              "measurementUnit": "G"
            },
            "value": "60.00",
            "description": "$60.00/1 kg"
          }
        },
        "subscriptionPricesInfo": {
          "subscriptionPrices": []
        }
      },
      {
        "id": "5aace0e6-4bab-4d0e-a595-1bcaa01d2377",
        "visible": true,
        "barcode": "111111112",
        "choices": [
          {
            "optionChoiceIds": {
              "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
              "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
            },
            "optionChoiceNames": {
              "optionName": "Size",
              "choiceName": "S",
              "renderType": "TEXT_CHOICES"
            }
          },
          {
            "optionChoiceIds": {
              "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
              "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
            },
            "optionChoiceNames": {
              "optionName": "Box color",
              "choiceName": "blue",
              "renderType": "SWATCH_CHOICES"
            }
          }
        ],
        "price": {
          "compareAtPrice": {
            "amount": "10",
            "formattedAmount": "$10.00"
          },
          "actualPrice": {
            "amount": "9.5",
            "formattedAmount": "$9.50"
          }
        },
        "revenueDetails": {
          "cost": {
            "amount": "8",
            "formattedAmount": "$8.00"
          },
          "profit": {
            "amount": "1.5",
            "formattedAmount": "$1.50"
          },
          "profitMargin": 0.1579
        },
        "media": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "physicalProperties": {
          "weight": 0.2,
          "pricePerUnit": {
            "settings": {
              "quantity": 150.0,
              "measurementUnit": "G"
            },
            "value": "63.33",
            "description": "$63.33/1 kg"
          }
        },
        "subscriptionPricesInfo": {
          "subscriptionPrices": []
        }
      },
      {
        "id": "1d2acec3-5294-4521-a648-6f2ed5f58c43",
        "visible": false,
        "barcode": "111111113",
        "choices": [
          {
            "optionChoiceIds": {
              "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
              "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
            },
            "optionChoiceNames": {
              "optionName": "Size",
              "choiceName": "L",
              "renderType": "TEXT_CHOICES"
            }
          },
          {
            "optionChoiceIds": {
              "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
              "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
            },
            "optionChoiceNames": {
              "optionName": "Box color",
              "choiceName": "red",
              "renderType": "SWATCH_CHOICES"
            }
          }
        ],
        "price": {
          "compareAtPrice": {
            "amount": "15",
            "formattedAmount": "$15.00"
          },
          "actualPrice": {
            "amount": "14",
            "formattedAmount": "$14.00"
          }
        },
        "revenueDetails": {
          "cost": {
            "amount": "10",
            "formattedAmount": "$10.00"
          },
          "profit": {
            "amount": "4",
            "formattedAmount": "$4.00"
          },
          "profitMargin": 0.2857
        },
        "media": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "physicalProperties": {
          "weight": 0.4,
          "pricePerUnit": {
            "settings": {
              "quantity": 300.0,
              "measurementUnit": "G"
            },
            "value": "46.67",
            "description": "$46.67/1 kg"
          }
        },
        "subscriptionPricesInfo": {
          "subscriptionPrices": []
        }
      },
      {
        "id": "5c390d11-8d35-48e3-8037-428812e0426c",
        "visible": true,
        "barcode": "111111114",
        "choices": [
          {
            "optionChoiceIds": {
              "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
              "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
            },
            "optionChoiceNames": {
              "optionName": "Size",
              "choiceName": "L",
              "renderType": "TEXT_CHOICES"
            }
          },
          {
            "optionChoiceIds": {
              "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
              "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
            },
            "optionChoiceNames": {
              "optionName": "Box color",
              "choiceName": "blue",
              "renderType": "SWATCH_CHOICES"
            }
          }
        ],
        "price": {
          "actualPrice": {
            "amount": "15",
            "formattedAmount": "$15.00"
          }
        },
        "media": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "physicalProperties": {
          "weight": 0.4,
          "pricePerUnit": {
            "settings": {
              "quantity": 300.0,
              "measurementUnit": "G"
            },
            "value": "50.00",
            "description": "$50.00/1 kg"
          }
        },
        "subscriptionPricesInfo": {
          "subscriptionPrices": []
        }
      }
    ]
  }
}
Did this help?

Yes

No
POST
Create Product
Creates a new product.

This endpoint also allows to add a ribbon, brand, info sections, options, and modifiers.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/products
Body Params
product
Product
Required
Product to create.

At least 1 variant must be provided and each variant must have relevant item in choices field for every item in options. If options is empty one default variant must be provided with empty choices list.

Show Child Properties
fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Created product.

Show Child Properties
Example shown:
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/products' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
    "product": {
        "name": "Shopping bag",
        "productType": "PHYSICAL",
        "physicalProperties": {},
        "variantsInfo": {
            "variants": [
                {
                    "price": {
                        "actualPrice": {
                            "amount": "0.5"
                        }
                    },
                    "physicalProperties": {}
                }
            ]
        }
   }
}'
Response
JSON
{
  "product": {
    "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
    "revision": "1",
    "createdDate": "2025-01-01T10:13:14.540Z",
    "updatedDate": "2025-01-01T10:13:14.540Z",
    "name": "Shopping bag",
    "slug": "shopping-bag",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": null,
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "OUT_OF_STOCK",
      "preorderStatus": "DISABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": null,
      "deliveryProfileId": null
    },
    "handle": "Product_a7daf3a2-2a31-49b3-8a64-8264cd1006c7",
    "currency": null,
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "75ba03bc-e56f-4b6d-be52-691eb2ed5fd7",
          "visible": true,
          "sku": null,
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "0.5",
              "formattedAmount": null
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          },
          "physicalProperties": {
            "weight": null,
            "pricePerUnit": null
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735726394407000",
    "flattenOptions": [],
    "flattenModifiers": [],
    "variantSummary": {
      "variantCount": 1
    },
    "minVariantPriceInfo": null
  }
}
Errors
Expand All
400
Invalid Argument
There are 12 errors with this status code.


Show
404
Not Found
There are 5 errors with this status code.


Show
409
Already Exists
There are 5 errors with this status code.


Show
428
Failed Precondition
There are 14 errors with this status code.


Show
500
Internal
There are 4 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Created
Did this help?

Yes

No
POST
Create Product With Inventory
Creates a new product, and can create the product's inventory in the variants' default locations.

This endpoint also allows to add a ribbon, brand, info sections, options, and modifiers.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/products-with-inventory
Body Params
product
Product
Required
Product to create with inventory.

At least one variant must be provided and each variant must have relevant item in choices field for every item in options. If options is empty one default variant must be provided with empty choices list.

Show Child Properties
returnEntity
boolean
Whether to return inventory entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Created product.

Show Child Properties
inventoryResults
InventoryResults
Inventories created by bulk action.

Show Child Properties
Example shown:
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/products-with-inventory' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "product": {
        "name": "Shopping bag",
        "productType": "PHYSICAL",
        "variantsInfo": {
          "variants": [
            {
              "price": {
                "actualPrice": {
                  "amount": "0.5"
                }
              },
              "inventoryItem": {
                "inStock": false
              }
            }
          ]
        },
        "physicalProperties": {}
      }
    }'
Response
JSON
{
  "product": {
    "id": "789e6969-6eb4-4799-aacb-e207037564c4",
    "revision": "1",
    "createdDate": "2025-01-02T07:36:01.066Z",
    "updatedDate": "2025-01-02T07:36:01.066Z",
    "name": "Shopping bag",
    "slug": "shopping-bag-1",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": null,
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "OUT_OF_STOCK",
      "preorderStatus": "DISABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": null,
      "deliveryProfileId": null
    },
    "handle": "Product_f3e89a8b-5865-47de-86fa-cd923c2586e5",
    "currency": null,
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "a3c6d6b2-4265-4e9a-8406-cafd4a61fb06",
          "visible": true,
          "sku": null,
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "0.5",
              "formattedAmount": null
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735803361054000",
    "flattenOptions": [],
    "flattenModifiers": [],
    "variantSummary": {
      "variantCount": 1
    },
    "minVariantPriceInfo": null
  },
  "inventoryResults": {
    "results": [
      {
        "itemMetadata": {
          "id": "2937f8d3-3439-4e46-83ab-7a83e4e37da1",
          "originalIndex": 0,
          "success": true,
          "error": null
        },
        "item": null
      }
    ],
    "bulkActionMetadata": {
      "totalSuccesses": 1,
      "totalFailures": 0,
      "undetailedFailures": 0
    },
    "error": null
  }
}
Errors
Expand All
400
Invalid Argument
There are 8 errors with this status code.


Show
404
Not Found
There are 3 errors with this status code.


Show
428
Failed Precondition
There is 1 error with this status code.


Show
500
Internal
There are 3 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Created
Did this help?

Yes

No
PATCH
Update Product
Updates a product.

Each time the product is updated, revision increments by 1. The current revision must be passed when updating the product. This ensures you're working with the latest product and prevents unintended overwrites.

Notes:

To update array fields like options, modifiers, variantsInfo.variants, and any others, you must pass the entire existing array. Passing only the changed item will overwrite the entire array, not just merge the single change.
To update variantsInfo.variants you must also pass options and vise versa. This is because variants and options are mutually dependant and must be aligned.
To update existing variantsInfo.variants, make sure to provide variantsInfo.variants.id. If no ID is passed, the variant will be created with a new ID.
Updating media per variant is not supported. Instead, assign media items to product option choices using the linkedMedia field. You must use preexisting product media.
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v3/products/{product.id}
Path Params
product.id
string
Required
Product ID.

Body Params
product
Product
Required
Product to update.

Show Child Properties
fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Updated product.

Show Child Properties
Example shown:
Request
cURL
curl PATCH 'https://www.wixapis.com/stores/v3/products/9e8924aa-c3f2-4fe6-bc98-ace47295c52d' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "product": {
        "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
        "revision": "2",
        "name": "Shopping bag"
      }
    }'
Response
JSON
{
  "product": {
    "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
    "revision": "3",
    "createdDate": "2025-01-01T10:13:14.540Z",
    "updatedDate": "2025-01-01T12:59:03.102Z",
    "name": "Shopping bag",
    "slug": "shopping-bag",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "OUT_OF_STOCK",
      "preorderStatus": "DISABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": null,
      "deliveryProfileId": null
    },
    "handle": "Product_a7daf3a2-2a31-49b3-8a64-8264cd1006c7",
    "currency": null,
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "75ba03bc-e56f-4b6d-be52-691eb2ed5fd7",
          "visible": true,
          "sku": null,
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "0.5",
              "formattedAmount": null
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          },
          "physicalProperties": {
            "weight": null,
            "pricePerUnit": null
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735726394407000",
    "flattenOptions": [],
    "flattenModifiers": [],
    "variantSummary": {
      "variantCount": 1
    },
    "minVariantPriceInfo": null
  }
}
Errors
Expand All
400
Invalid Argument
There are 11 errors with this status code.


Show
404
Not Found
There are 4 errors with this status code.


Show
409
Already Exists
There are 5 errors with this status code.


Show
428
Failed Precondition
There are 12 errors with this status code.


Show
500
Internal
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
PATCH
Update Product With Inventory
Updates a product.

Each time the product is updated, revision increments by 1. The current revision must be passed when updating the product. This ensures you're working with the latest product and prevents unintended overwrites.

Notes:

To update array fields like options, modifiers, variantsInfo.variants, and any others, you must pass the entire existing array. Passing only the changed item will overwrite the entire array, not just merge the single change.
To update variantsInfo.variants you must also pass options and vise versa. This is because variants depend on options, and options depend on variants.
To update existing variantsInfo.variants, make sure to provide variantsInfo.variants.id. If no ID is passed, the variant will be created with a new ID.
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
PATCH
https://www.wixapis.com/stores/v3/products-with-inventory/{product.id}
Path Params
product.id
string
Required
Product ID.

Body Params
product
Product
Required
Product to update.

Show Child Properties
returnEntity
boolean
Whether to return the full inventory entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Updated product.

Show Child Properties
inventoryResults
InventoryResults
Inventories updated by bulk action.

Show Child Properties
Example shown:
Update product with inventory
Request
cURL
curl PATCH 'https://www.wixapis.com/stores/v3/products-with-inventory/abc62281-87b7-47e8-98ba-20e25341ad98' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
          "product": {
            "id": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
            "revision": "2",
            "variantsInfo": {
              "variants": [
                {
                  "id": "3bc237b4-d480-46e2-b49d-7b92a746780f",
                  "choices": [],
                  "inventoryItem": {
                    "in_stock": false
                  },
                  "price": {
                    "actualPrice": {
                      "amount": "0.5"
                    }
                  }
                }
              ]
            }
          }
        }'
Response
JSON
{
  "product": {
    "id": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
    "revision": "3",
    "createdDate": "2025-01-02T07:40:14.776Z",
    "updatedDate": "2025-01-02T07:40:14.776Z",
    "name": "Coffee",
    "slug": "coffee-6",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": null,
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "IN_STOCK",
      "preorderStatus": "ENABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": null,
      "deliveryProfileId": null
    },
    "handle": "Product_3d88a9cf-39e7-47c7-9c95-40b71b00098a",
    "currency": "USD",
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "10.00",
        "formattedAmount": "$10.00"
      },
      "maxValue": {
        "amount": "10.00",
        "formattedAmount": "$10.00"
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "10.00",
        "formattedAmount": "$10.00"
      },
      "maxValue": {
        "amount": "10.00",
        "formattedAmount": "$10.00"
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "3bc237b4-d480-46e2-b49d-7b92a746780f",
          "visible": true,
          "sku": "7777788",
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "10.00",
              "formattedAmount": "$10.00"
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          },
          "physicalProperties": {
            "weight": null,
            "pricePerUnit": null
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735803614775000",
    "flattenOptions": [],
    "flattenModifiers": []
  },
  "bulkActionMetadata": {
    "totalSuccesses": 1,
    "totalFailures": 0,
    "undetailedFailures": 0
  },
  "inventoryResults": {
    "results": [
      {
        "itemMetadata": {
          "id": "2e1c8e1a-4534-4803-894a-3a4b2229149e",
          "originalIndex": 0,
          "success": true,
          "error": null
        },
        "item": {
          "id": "2e1c8e1a-4534-4803-894a-3a4b2229149e",
          "revision": "1",
          "createdDate": "2025-01-02T07:40:14.880Z",
          "updatedDate": "2025-01-02T07:40:14.880Z",
          "variantId": "ccf43445-fc4f-4a21-9bd8-075c6f2880c1",
          "locationId": "12fd1450-8f43-425a-87e7-3cb48bfc1249",
          "productId": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
          "quantity": 19000,
          "trackQuantity": true,
          "availabilityStatus": "IN_STOCK",
          "preorderInfo": {
            "enabled": true,
            "counter": 0,
            "limit": 10,
            "message": null,
            "quantity": 10
          },
          "product": null,
          "extendedFields": null
        }
      }
    ],
    "bulkActionMetadata": {
      "totalSuccesses": 1,
      "totalFailures": 0,
      "undetailedFailures": 0
    },
    "error": null
  }
}
Errors
Expand All
400
Invalid Argument
There are 5 errors with this status code.


Show
404
Not Found
There are 3 errors with this status code.


Show
428
Failed Precondition
There are 2 errors with this status code.


Show
500
Internal
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Create Products
Creates up to 100 products.

Note: The following limits apply to the total number of creatable entities in a single request. For example, you can create 10 products with up to 10 options for each product (10 x 10 = 100), or one product with 100 options. Alternatively, you can create 100 products with up to 10 variants in each (100 x 10 = 1000), or one product with 1000 variants.

options: 100
modifiers: 100
infoSections: 100
variantsInfo.variants: 1000
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/create
Body Params
products
Array <Product>
Required
minItems 1
maxItems 100
List of products to create.

Show Child Properties
returnEntity
boolean
Whether to return the full product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
results
Array <BulkProductResult>
minItems 1
maxItems 100
Products created by bulk action.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Bulk create products
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/create' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "fields": [
        "CURRENCY"
      ],
      "products": [
        {
          "name": "Coffee",
          "variantsInfo": {
            "variants": [
              {
                "price": {
                  "actualPrice": {
                    "amount": "10.00",
                    "formattedAmount": "$10.00"
                  }
                },
                "sku": "12345"
              }
            ]
          },
          "productType": "PHYSICAL",
          "physicalProperties": {}
        },
        {
          "name": "Chocolate bar",
          "visible": false,
          "variantsInfo": {
            "variants": [
              {
                "price": {
                  "compareAtPrice": {
                    "amount": "7.00",
                    "formattedAmount": "$7.00"
                  },
                  "actualPrice": {
                    "amount": "6.00",
                    "formattedAmount": "$6.00"
                  }
                }
              }
            ]
          },
          "productType": "PHYSICAL",
          "physicalProperties": {}
        }
      ],
      "returnEntity": true
    }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "93f2e5ab-60a5-4173-babb-9198fc52bdd3",
        "originalIndex": 0,
        "success": true,
        "error": null
      },
      "item": {
        "id": "93f2e5ab-60a5-4173-babb-9198fc52bdd3",
        "revision": "1",
        "createdDate": "2025-01-01T09:50:31.438Z",
        "updatedDate": "2025-01-01T09:50:31.438Z",
        "name": "Coffee",
        "slug": "coffee",
        "url": null,
        "description": null,
        "plainDescription": null,
        "visible": true,
        "visibleInPos": true,
        "media": {
          "main": null,
          "itemsInfo": null
        },
        "seoData": null,
        "taxGroupId": null,
        "options": [],
        "modifiers": [],
        "brand": null,
        "infoSections": [],
        "ribbon": null,
        "directCategoriesInfo": null,
        "allCategoriesInfo": null,
        "mainCategoryId": null,
        "directCategoryIdsInfo": null,
        "costRange": null,
        "inventory": {
          "preorderAvailability": "NO_VARIANTS",
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": null,
          "fulfillerId": null,
          "shippingGroupId": null,
          "shippingWeightRange": null,
          "pricePerUnitRange": null,
          "weightMeasurementUnitInfo": null,
          "deliveryProfileId": null
        },
        "handle": "Product_be600651-94cf-42ad-881f-3bd69fb4a320",
        "currency": null,
        "breadcrumbsInfo": null,
        "actualPriceRange": {
          "minValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          },
          "maxValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          }
        },
        "compareAtPriceRange": {
          "minValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          },
          "maxValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          }
        },
        "variantsInfo": {
          "variants": [
            {
              "id": "d44f6c3f-e641-4e54-9cb3-5796e58fa1cd",
              "visible": true,
              "sku": "12345",
              "barcode": null,
              "choices": [],
              "price": {
                "actualPrice": {
                  "amount": "10.00",
                  "formattedAmount": "$10.00"
                },
                "compareAtPrice": null
              },
              "revenueDetails": null,
              "media": null,
              "subscriptionPricesInfo": null,
              "inventoryStatus": {
                "inStock": false,
                "preorderEnabled": false
              }
            }
          ]
        },
        "subscriptionDetails": null,
        "extendedFields": null,
        "seoTitle": null,
        "seoDescription": null,
        "numericId": "1735725031408000",
        "flattenOptions": [],
        "flattenModifiers": [],
        "variantSummary": {
          "variantCount": 1
        },
        "minVariantPriceInfo": null
      }
    },
    {
      "itemMetadata": {
        "id": "932a7008-c31e-43a9-9ba9-d042ad79fd3e",
        "originalIndex": 1,
        "success": true,
        "error": null
      },
      "item": {
        "id": "932a7008-c31e-43a9-9ba9-d042ad79fd3e",
        "revision": "1",
        "createdDate": "2025-01-01T09:50:31.438Z",
        "updatedDate": "2025-01-01T09:50:31.438Z",
        "name": "Chocolate bar",
        "slug": "chocolate-bar",
        "url": null,
        "description": null,
        "plainDescription": null,
        "visible": false,
        "visibleInPos": true,
        "media": {
          "main": null,
          "itemsInfo": null
        },
        "seoData": null,
        "taxGroupId": null,
        "options": [],
        "modifiers": [],
        "brand": null,
        "infoSections": [],
        "ribbon": null,
        "directCategoriesInfo": null,
        "allCategoriesInfo": null,
        "mainCategoryId": null,
        "directCategoryIdsInfo": null,
        "costRange": null,
        "inventory": {
          "preorderAvailability": "NO_VARIANTS",
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": null,
          "fulfillerId": null,
          "shippingGroupId": null,
          "shippingWeightRange": null,
          "pricePerUnitRange": null,
          "weightMeasurementUnitInfo": null,
          "deliveryProfileId": null
        },
        "handle": "Product_b42607d1-bc36-44e7-a2a9-127be6ee3625",
        "currency": null,
        "breadcrumbsInfo": null,
        "actualPriceRange": {
          "minValue": {
            "amount": "6.00",
            "formattedAmount": "$6.00"
          },
          "maxValue": {
            "amount": "6.00",
            "formattedAmount": "$6.00"
          }
        },
        "compareAtPriceRange": {
          "minValue": {
            "amount": "7.00",
            "formattedAmount": "$7.00"
          },
          "maxValue": {
            "amount": "7.00",
            "formattedAmount": "$7.00"
          }
        },
        "variantsInfo": {
          "variants": [
            {
              "id": "2eae6a6b-05d3-46ba-85a0-2cf9e6cdd4a7",
              "visible": true,
              "sku": null,
              "barcode": null,
              "choices": [],
              "price": {
                "actualPrice": {
                  "amount": "6.00",
                  "formattedAmount": "$6.00"
                },
                "compareAtPrice": {
                  "amount": "7.00",
                  "formattedAmount": "$7.00"
                }
              },
              "revenueDetails": null,
              "media": null,
              "subscriptionPricesInfo": null,
              "inventoryStatus": {
                "inStock": false,
                "preorderEnabled": false
              }
            }
          ]
        },
        "subscriptionDetails": null,
        "extendedFields": null,
        "seoTitle": null,
        "seoDescription": null,
        "numericId": "1735725031408001",
        "flattenOptions": [],
        "flattenModifiers": [],
        "variantSummary": {
          "variantCount": 1
        },
        "minVariantPriceInfo": null
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
Expand All
400
Invalid Argument
There are 13 errors with this status code.


Show
404
Not Found
There are 5 errors with this status code.


Show
409
Already Exists
There are 5 errors with this status code.


Show
428
Failed Precondition
There are 14 errors with this status code.


Show
500
Internal
There are 4 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Created
Did this help?

Yes

No
POST
Bulk Create Products With Inventory
Creates up to 100 products, and can create the products' inventories in the variants' default locations.

Note: The following limits apply to the total number of creatable entities in a single request. For example, you can create 10 products with up to 10 options for each product (10 x 10 = 100), or one product with 100 options. Alternatively, you can create 100 products with up to 10 variants in each (100 x 10 = 1000), or one product with 1000 variants.

options: 100
modifiers: 100
infoSections: 100
variantsInfo.variants: 1000
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Inventory write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products-with-inventory/create
Body Params
products
Array <ProductWithInventory>
Required
minItems 1
maxItems 100
List of products to create with inventory.

Show Child Properties
returnEntity
boolean
Whether to return the full product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
productResults
ProductResults
Products created by bulk action.

Show Child Properties
inventoryResults
InventoryResults
Inventories created by bulk action.

Show Child Properties
Example shown:
Bulk create products
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/create' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "fields": [
        "CURRENCY"
      ],
      "products": [
        {
          "name": "Coffee",
          "productType": "PHYSICAL",
          "variantsInfo": {
            "variants": [
              {
                "sku": "7777788",
                "price": {
                  "actualPrice": {
                    "amount": "10"
                  }
                },
                "inventoryItem": {
                  "preorderInfo": {
                    "enabled": true,
                    "limit": 10,
                    "quantity": 3
                  },
                  "quantity": 19000
                },
                "physicalProperties": {}
              }
            ]
          },
          "physicalProperties": {}
        },
        {
          "name": "Chocolate bar",
          "visible": false,
          "productType": "PHYSICAL",
          "variantsInfo": {
            "variants": [
              {
                "price": {
                  "actualPrice": {
                    "amount": "6"
                  },
                  "compareAtPrice": {
                    "amount": "7"
                  }
                }
              }
            ]
          },
          "physicalProperties": {}
        }
      ],
      "returnEntity": true
    }'
Response
JSON
{
  "productResults": {
    "results": [
      {
        "itemMetadata": {
          "id": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
          "originalIndex": 0,
          "success": true,
          "error": null
        },
        "item": {
          "id": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
          "revision": "1",
          "createdDate": "2025-01-02T07:40:14.776Z",
          "updatedDate": "2025-01-02T07:40:14.776Z",
          "name": "Coffee",
          "slug": "coffee-6",
          "url": null,
          "description": null,
          "plainDescription": null,
          "visible": true,
          "visibleInPos": true,
          "media": {
            "main": null,
            "itemsInfo": null
          },
          "seoData": null,
          "taxGroupId": null,
          "options": [],
          "modifiers": [],
          "brand": null,
          "infoSections": [],
          "ribbon": null,
          "directCategoriesInfo": null,
          "allCategoriesInfo": null,
          "mainCategoryId": null,
          "directCategoryIdsInfo": null,
          "costRange": null,
          "inventory": {
            "preorderAvailability": "NO_VARIANTS",
            "availabilityStatus": "IN_STOCK",
            "preorderStatus": "ENABLED"
          },
          "productType": "PHYSICAL",
          "physicalProperties": {
            "pricePerUnit": null,
            "fulfillerId": null,
            "shippingGroupId": null,
            "shippingWeightRange": null,
            "pricePerUnitRange": null,
            "weightMeasurementUnitInfo": null,
            "deliveryProfileId": null
          },
          "handle": "Product_3d88a9cf-39e7-47c7-9c95-40b71b00098a",
          "currency": "USD",
          "breadcrumbsInfo": null,
          "actualPriceRange": {
            "minValue": {
              "amount": "10.00",
              "formattedAmount": "$10.00"
            },
            "maxValue": {
              "amount": "10.00",
              "formattedAmount": "$10.00"
            }
          },
          "compareAtPriceRange": {
            "minValue": {
              "amount": "10.00",
              "formattedAmount": "$10.00"
            },
            "maxValue": {
              "amount": "10.00",
              "formattedAmount": "$10.00"
            }
          },
          "variantsInfo": {
            "variants": [
              {
                "id": "ccf43445-fc4f-4a21-9bd8-075c6f2880c1",
                "visible": true,
                "sku": "7777788",
                "barcode": null,
                "choices": [],
                "price": {
                  "actualPrice": {
                    "amount": "10.00",
                    "formattedAmount": "$10.00"
                  },
                  "compareAtPrice": null
                },
                "revenueDetails": null,
                "media": null,
                "subscriptionPricesInfo": null,
                "inventoryStatus": {
                  "inStock": false,
                  "preorderEnabled": false
                },
                "physicalProperties": {
                  "weight": null,
                  "pricePerUnit": null
                }
              }
            ]
          },
          "subscriptionDetails": null,
          "extendedFields": null,
          "seoTitle": null,
          "seoDescription": null,
          "numericId": "1735803614775000",
          "flattenOptions": [],
          "flattenModifiers": [],
          "variantSummary": {
            "variantCount": 1
          },
          "minVariantPriceInfo": null
        }
      },
      {
        "itemMetadata": {
          "id": "6f1e726f-b47a-48bf-87da-e6501309ca87",
          "originalIndex": 1,
          "success": true,
          "error": null
        },
        "item": {
          "id": "6f1e726f-b47a-48bf-87da-e6501309ca87",
          "revision": "1",
          "createdDate": "2025-01-02T07:40:14.776Z",
          "updatedDate": "2025-01-02T07:40:14.776Z",
          "name": "Chocolate bar",
          "slug": "chocolate-bar-11",
          "url": null,
          "description": null,
          "plainDescription": null,
          "visible": false,
          "visibleInPos": true,
          "media": {
            "main": null,
            "itemsInfo": null
          },
          "seoData": null,
          "taxGroupId": null,
          "options": [],
          "modifiers": [],
          "brand": null,
          "infoSections": [],
          "ribbon": null,
          "directCategoriesInfo": null,
          "allCategoriesInfo": null,
          "mainCategoryId": null,
          "directCategoryIdsInfo": null,
          "costRange": null,
          "inventory": {
            "preorderAvailability": "NO_VARIANTS",
            "availabilityStatus": "OUT_OF_STOCK",
            "preorderStatus": "DISABLED"
          },
          "productType": "PHYSICAL",
          "physicalProperties": {
            "pricePerUnit": null,
            "fulfillerId": null,
            "shippingGroupId": null,
            "shippingWeightRange": null,
            "pricePerUnitRange": null,
            "weightMeasurementUnitInfo": null,
            "deliveryProfileId": null
          },
          "handle": "Product_67ab062e-4c8b-4507-aff0-cd4520d9af0c",
          "currency": "USD",
          "breadcrumbsInfo": null,
          "actualPriceRange": {
            "minValue": {
              "amount": "6.00",
              "formattedAmount": "$6.00"
            },
            "maxValue": {
              "amount": "6.00",
              "formattedAmount": "$6.00"
            }
          },
          "compareAtPriceRange": {
            "minValue": {
              "amount": "7.00",
              "formattedAmount": "$7.00"
            },
            "maxValue": {
              "amount": "7.00",
              "formattedAmount": "$7.00"
            }
          },
          "variantsInfo": {
            "variants": [
              {
                "id": "d254f7f4-1aa4-423f-a5ad-8e1260224339",
                "visible": true,
                "sku": null,
                "barcode": null,
                "choices": [],
                "price": {
                  "actualPrice": {
                    "amount": "6.00",
                    "formattedAmount": "$6.00"
                  },
                  "compareAtPrice": {
                    "amount": "7.00",
                    "formattedAmount": "$7.00"
                  }
                },
                "revenueDetails": null,
                "media": null,
                "subscriptionPricesInfo": null,
                "inventoryStatus": {
                  "inStock": false,
                  "preorderEnabled": false
                }
              }
            ]
          },
          "subscriptionDetails": null,
          "extendedFields": null,
          "seoTitle": null,
          "seoDescription": null,
          "numericId": "1735803614775001",
          "flattenOptions": [],
          "flattenModifiers": [],
          "variantSummary": {
            "variantCount": 1
          },
          "minVariantPriceInfo": null
        }
      }
    ],
    "bulkActionMetadata": {
      "totalSuccesses": 2,
      "totalFailures": 0,
      "undetailedFailures": 0
    }
  },
  "inventoryResults": {
    "results": [
      {
        "itemMetadata": {
          "id": "2e1c8e1a-4534-4803-894a-3a4b2229149e",
          "originalIndex": 0,
          "success": true,
          "error": null
        },
        "item": {
          "id": "2e1c8e1a-4534-4803-894a-3a4b2229149e",
          "revision": "1",
          "createdDate": "2025-01-02T07:40:14.880Z",
          "updatedDate": "2025-01-02T07:40:14.880Z",
          "variantId": "ccf43445-fc4f-4a21-9bd8-075c6f2880c1",
          "locationId": "12fd1450-8f43-425a-87e7-3cb48bfc1249",
          "productId": "4de56f39-7cfd-4e6b-8437-25825d9d5d6a",
          "quantity": 19000,
          "trackQuantity": true,
          "availabilityStatus": "IN_STOCK",
          "preorderInfo": {
            "enabled": true,
            "counter": 0,
            "limit": 10,
            "message": null,
            "quantity": 10
          },
          "product": null,
          "extendedFields": null
        }
      }
    ],
    "bulkActionMetadata": {
      "totalSuccesses": 1,
      "totalFailures": 0,
      "undetailedFailures": 0
    },
    "error": null
  }
}
Errors
Expand All
400
Invalid Argument
There are 9 errors with this status code.


Show
404
Not Found
There are 3 errors with this status code.


Show
428
Failed Precondition
There are 2 errors with this status code.


Show
500
Internal
There are 3 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Created
Did this help?

Yes

No
POST
Bulk Update Products
Updates up to 100 products.

Note: The following limits apply to the total number of updatable entities in a single request. For example, you can update 10 products with up to 10 options for each product (10 x 10 = 100), or one product with 100 options. Alternatively, you can update 100 products with up to 10 variants in each (100 x 10 = 1000), or one product with 1000 variants.

options: 100
modifiers: 100
infoSections: 100
variantsInfo.variants: 1000
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/update
Body Params
products
Array <MaskedProduct>
Required
minItems 1
maxItems 100
List of products to update.

Show Child Properties
returnEntity
boolean
Whether to return the full product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
results
Array <BulkProductResult>
minItems 1
maxItems 100
Products updated by bulk action.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Bulk update products
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/update' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
     {
       "fields": [
         "CURRENCY",
         "INFO_SECTION",
         "MERCHANT_DATA",
         "SUBSCRIPTION_PRICES_INFO",
         "WEIGHT_MEASUREMENT_UNIT_INFO"
       ]
     },
      "products": [
        {
          "product": {
            "id": "93f2e5ab-60a5-4173-babb-9198fc52bdd3",
            "revision": "2",
            "name": "Premium Coffee"
          }
        },
        {
          "product": {
            "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
            "revision": "3",
            "visible": true
          }
        }
      ],
      "returnEntity": true
    }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "93f2e5ab-60a5-4173-babb-9198fc52bdd3",
        "originalIndex": 0,
        "success": true,
        "error": null
      },
      "item": {
        "id": "93f2e5ab-60a5-4173-babb-9198fc52bdd3",
        "revision": "3",
        "createdDate": "2025-01-01T09:50:31.438Z",
        "updatedDate": "2025-01-02T07:09:20.093Z",
        "name": "Coffee",
        "slug": "coffee",
        "url": null,
        "description": null,
        "plainDescription": null,
        "visible": true,
        "visibleInPos": true,
        "media": {
          "main": null,
          "itemsInfo": null
        },
        "seoData": null,
        "taxGroupId": null,
        "options": [],
        "modifiers": [],
        "brand": null,
        "infoSections": [],
        "ribbon": null,
        "directCategoriesInfo": null,
        "allCategoriesInfo": null,
        "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
        "directCategoryIdsInfo": null,
        "costRange": {
          "minValue": {
            "amount": "0.00",
            "formattedAmount": "$0.00"
          },
          "maxValue": {
            "amount": "0.00",
            "formattedAmount": "$0.00"
          }
        },
        "inventory": {
          "preorderAvailability": "NO_VARIANTS",
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": null,
          "fulfillerId": null,
          "shippingGroupId": null,
          "shippingWeightRange": null,
          "pricePerUnitRange": null,
          "weightMeasurementUnitInfo": {
            "weightMeasurementUnit": "KG"
          },
          "deliveryProfileId": null
        },
        "handle": "Product_be600651-94cf-42ad-881f-3bd69fb4a320",
        "currency": "USD",
        "breadcrumbsInfo": null,
        "actualPriceRange": {
          "minValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          },
          "maxValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          }
        },
        "compareAtPriceRange": {
          "minValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          },
          "maxValue": {
            "amount": "10.00",
            "formattedAmount": "$10.00"
          }
        },
        "variantsInfo": {
          "variants": [
            {
              "id": "d44f6c3f-e641-4e54-9cb3-5796e58fa1cd",
              "visible": true,
              "sku": "12345",
              "barcode": null,
              "choices": [],
              "price": {
                "actualPrice": {
                  "amount": "10.00",
                  "formattedAmount": "$10.00"
                },
                "compareAtPrice": null
              },
              "revenueDetails": null,
              "media": null,
              "subscriptionPricesInfo": {
                "subscriptionPrices": []
              },
              "inventoryStatus": {
                "inStock": false,
                "preorderEnabled": false
              }
            }
          ]
        },
        "subscriptionDetails": null,
        "extendedFields": null,
        "seoTitle": null,
        "seoDescription": null,
        "numericId": "1735725031408000",
        "flattenOptions": [],
        "flattenModifiers": [],
        "variantSummary": {
          "variantCount": 1
        },
        "minVariantPriceInfo": null
      }
    },
    {
      "itemMetadata": {
        "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
        "originalIndex": 1,
        "success": true,
        "error": null
      },
      "item": {
        "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
        "revision": "4",
        "createdDate": "2025-01-01T10:13:14.540Z",
        "updatedDate": "2025-01-02T07:09:20.093Z",
        "name": "Shopping bag",
        "slug": "shopping-bag",
        "url": null,
        "description": null,
        "plainDescription": null,
        "visible": true,
        "visibleInPos": true,
        "media": {
          "main": null,
          "itemsInfo": null
        },
        "seoData": null,
        "taxGroupId": null,
        "options": [],
        "modifiers": [],
        "brand": null,
        "infoSections": [],
        "ribbon": null,
        "directCategoriesInfo": null,
        "allCategoriesInfo": null,
        "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
        "directCategoryIdsInfo": null,
        "costRange": {
          "minValue": {
            "amount": "0.00",
            "formattedAmount": "$0.00"
          },
          "maxValue": {
            "amount": "0.00",
            "formattedAmount": "$0.00"
          }
        },
        "inventory": {
          "preorderAvailability": "NO_VARIANTS",
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": null,
          "fulfillerId": null,
          "shippingGroupId": null,
          "shippingWeightRange": null,
          "pricePerUnitRange": null,
          "weightMeasurementUnitInfo": {
            "weightMeasurementUnit": "KG"
          },
          "deliveryProfileId": null
        },
        "handle": "Product_a7daf3a2-2a31-49b3-8a64-8264cd1006c7",
        "currency": "USD",
        "breadcrumbsInfo": null,
        "actualPriceRange": {
          "minValue": {
            "amount": "0.50",
            "formattedAmount": "$0.50"
          },
          "maxValue": {
            "amount": "0.50",
            "formattedAmount": "$0.50"
          }
        },
        "compareAtPriceRange": {
          "minValue": {
            "amount": "0.50",
            "formattedAmount": "$0.50"
          },
          "maxValue": {
            "amount": "0.50",
            "formattedAmount": "$0.50"
          }
        },
        "variantsInfo": {
          "variants": [
            {
              "id": "75ba03bc-e56f-4b6d-be52-691eb2ed5fd7",
              "visible": true,
              "sku": null,
              "barcode": null,
              "choices": [],
              "price": {
                "actualPrice": {
                  "amount": "0.50",
                  "formattedAmount": "$0.50"
                },
                "compareAtPrice": null
              },
              "revenueDetails": null,
              "media": null,
              "subscriptionPricesInfo": {
                "subscriptionPrices": []
              },
              "inventoryStatus": {
                "inStock": false,
                "preorderEnabled": false
              },
              "physicalProperties": {
                "weight": null,
                "pricePerUnit": null
              }
            }
          ]
        },
        "subscriptionDetails": null,
        "extendedFields": null,
        "seoTitle": null,
        "seoDescription": null,
        "numericId": "1735726394407000",
        "flattenOptions": [],
        "flattenModifiers": [],
        "variantSummary": {
          "variantCount": 1
        },
        "minVariantPriceInfo": null
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
Expand All
400
Invalid Argument
There are 13 errors with this status code.


Show
404
Not Found
There are 4 errors with this status code.


Show
409
Already Exists
There are 5 errors with this status code.


Show
428
Failed Precondition
There are 13 errors with this status code.


Show
500
Internal
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Update Products With Inventory
Updates up to 100 products, and can update the products' inventories in the variants' default locations.

Note: The following limits apply to the total number of updatable entities in a single request. For example, you can update 10 products with up to 10 options for each product (10 x 10 = 100), or one product with 100 options. Alternatively, you can update 100 products with up to 10 variants in each (100 x 10 = 1000), or one product with 1000 variants.

options: 100
modifiers: 100
infoSections: 100
variantsInfo.variants: 1000
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Inventory write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products-with-inventory/update
Body Params
products
Array <MaskedProductWithInventory>
Required
minItems 1
maxItems 100
List of products to update.

Show Child Properties
returnEntity
boolean
Whether to return the full product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
productResults
ProductResults
Products updated by bulk action.

Show Child Properties
inventoryResults
InventoryResults
Inventories updated by bulk action.

Show Child Properties
Errors
Expand All
400
Invalid Argument
There are 6 errors with this status code.


Show
404
Not Found
There are 3 errors with this status code.


Show
428
Failed Precondition
There are 3 errors with this status code.


Show
500
Internal
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Update Products By Filter
Updates multiple products, given the provided filter.

To update infoSections, brand or ribbon fields, you must also pass their existing id.

Note: The following fields cannot be updated with this endpoint:

slug
options
modifiers
variantsInfo
To update these fields, use Bulk Update Products.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/update-by-filter
Body Params
filter
Filter
Filter object.

Show Child Properties
product
Product
Required
Product to update.

Show Child Properties
search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk update products by filter
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/update-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "filter": {
            "createdDate": {
                "$gt": "2024-07-22T13:22:45"
            }
        },
        "product": {
            "name": "Coffee",
            "description": {
                "nodes": [
                    {
                        "type": "PARAGRAPH",
                        "id": "foo",
                        "nodes": [
                            {
                                "type": "TEXT",
                                "textData": {
                                    "text": "Tasty and eco friendly, in a beautiful gift box."
                                }
                            }
                        ],
                        "paragraphData": {
                            "textStyle": {
                                "textAlignment": "AUTO"
                            }
                        }
                    }
                ],
                "metadata": {
                    "version": 1,
                    "id": "fb97b2c1-a3ff-4319-be5f-bbb7fdf0776c"
                }
            },
            "visible": true,
            "visibleInPos": true,
            "media": {
                "items": [
                    {
                        "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
                    }
                ]
            },
            "brand": {
                "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd"
            },
            "infoSections": [
                {
                    "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409"
                }
            ],
            "ribbon": {
                "id": "826aec2a-771b-45a6-9f72-392da18fd3bf"
            }
        }
    }
'
Response
JSON
{
  "jobId": "d825385c-785e-4c2a-9c54-4ab2a2b0d860"
}
Errors
Expand All
400
Invalid Argument
There are 7 errors with this status code.


Show
404
Not Found
There are 3 errors with this status code.


Show
409
Already Exists
There are 2 errors with this status code.


Show
428
Failed Precondition
There are 3 errors with this status code.


Show
500
Internal
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
GET
Get Product
Retrieves a product.

Note: To retrieve a non-visible product (visible: false), your app must have the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.

Permissions
Read products in v3 catalog
Product v3 read admin
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores/v3/products/{productId}
Path Params
productId
string
Required
Product ID.

Query Params
fields
Array <string>
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Product.

Show Child Properties
Example shown:
Request
cURL
curl -X GET \
 'https://www.wixapis.com/stores/v3/products/9e8924aa-c3f2-4fe6-bc98-ace47295c52d' \
 -H 'Content-Type: application/json' \
 -H 'Authorization: <AUTH>'
Response
JSON
{
  "product": {
    "id": "789e6969-6eb4-4799-aacb-e207037564c4",
    "revision": "1",
    "createdDate": "2025-01-02T07:36:01.066Z",
    "updatedDate": "2025-01-02T07:36:01.066Z",
    "name": "Shopping bag",
    "slug": "shopping-bag-1",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": null,
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "OUT_OF_STOCK",
      "preorderStatus": "DISABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": null,
      "deliveryProfileId": null
    },
    "handle": "Product_f3e89a8b-5865-47de-86fa-cd923c2586e5",
    "currency": null,
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "a3c6d6b2-4265-4e9a-8406-cafd4a61fb06",
          "visible": true,
          "sku": null,
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "0.5",
              "formattedAmount": null
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735803361054000",
    "flattenOptions": [],
    "flattenModifiers": [],
    "variantSummary": {
      "variantCount": 1
    },
    "minVariantPriceInfo": null
  },
  "inventoryResults": {
    "results": [
      {
        "itemMetadata": {
          "id": "2937f8d3-3439-4e46-83ab-7a83e4e37da1",
          "originalIndex": 0,
          "success": true,
          "error": null
        },
        "item": null
      }
    ],
    "bulkActionMetadata": {
      "totalSuccesses": 1,
      "totalFailures": 0,
      "undetailedFailures": 0
    },
    "error": null
  }
}
Errors
Expand All
403
Permission Denied
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
DELETE
Delete Product
Deletes a product and all its variants.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
DELETE
https://www.wixapis.com/stores/v3/products/{productId}
Path Params
productId
string
Required
Product ID.

Response Object
Returns an empty object.
Example shown:
Delete product
Request
cURL
curl -X DELETE \
 'https://www.wixapis.com/stores/v3/products/d17bb5c4-e10f-4b83-ae97-f27f2edc18f1' \
 -H 'Content-Type: application/json' \
 -H 'Authorization: <AUTH>'
Response
JSON
{}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Deleted
Did this help?

Yes

No
POST
Bulk Delete Products
Deletes multiple products.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/delete
Body Params
productIds
Array <string>
Required
minLength 1
maxLength 36
minItems 1
maxItems 100
IDs of products to delete.

Response Object
results
Array <BulkProductResult>
minItems 1
maxItems 100
Products deleted by bulk action.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Bulk delete products by ids from store
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/delete' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "productIds": [
            "abc62281-87b7-47e8-98ba-20e25341ad98",
            "ac491fa2-f5fc-479f-9123-65bc32d1ad28"
        ]
    }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "abc62281-87b7-47e8-98ba-20e25341ad98",
        "originalIndex": 0,
        "success": true
      }
    },
    {
      "itemMetadata": {
        "id": "ac491fa2-f5fc-479f-9123-65bc32d1ad28",
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
Expand All
400
Invalid Argument
There is 1 error with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Deleted
Did this help?

Yes

No
POST
Bulk Delete Products By Filter
Delete multiple products, given the provided filter.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/delete-by-filter
Body Params
filter
Filter
Required
Filter object.

Show Child Properties
search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk delete products by filter from store
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/delete-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "filter": {
            "createdDate": {
                "$gt": "2024-07-19T10:28:00"
            }
        },
        "search": {
            "expression": "bar"
        }
    }'
Response
JSON
{
  "jobId": "d4578ecb-9f55-4953-a29c-5fbfd379a40b"
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Deleted
Did this help?

Yes

No
GET
Get Product By Slug
Retrieves a product by slug.

Note: To retrieve a non-visible product (visible: false), your app must have the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.

Permissions
Read products in v3 catalog
Product v3 read admin
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores/v3/products/slug/{slug}
Path Params
slug
string
Required
Product slug.

Query Params
fields
Array <string>
Fields to include in the response.

Show Enum Values
Response Object
product
Product
Product.

Show Child Properties
Example shown:
Get Product by slug
Request
cURL
curl -X GET \
 'https://www.wixapis.com/stores/v3/products/slug/shopping-bag?fields=VARIANTS_INFO&fields=WEIGHT_MEASUREMENT_UNIT_INFO' \
 -H 'Content-Type: application/json' \
 -H 'Authorization: <AUTH>'
Response
JSON
{
  "product": {
    "id": "9e8924aa-c3f2-4fe6-bc98-ace47295c52d",
    "revision": "1",
    "createdDate": "2025-01-01T10:13:14.540Z",
    "updatedDate": "2025-01-01T10:13:15.689Z",
    "name": "Shopping bag",
    "slug": "shopping-bag",
    "url": null,
    "description": null,
    "plainDescription": null,
    "visible": true,
    "visibleInPos": true,
    "media": {
      "main": null,
      "itemsInfo": null
    },
    "seoData": null,
    "taxGroupId": null,
    "options": [],
    "modifiers": [],
    "brand": null,
    "infoSections": [],
    "ribbon": null,
    "directCategoriesInfo": null,
    "allCategoriesInfo": null,
    "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
    "directCategoryIdsInfo": null,
    "costRange": null,
    "inventory": {
      "preorderAvailability": "NO_VARIANTS",
      "availabilityStatus": "OUT_OF_STOCK",
      "preorderStatus": "DISABLED"
    },
    "productType": "PHYSICAL",
    "physicalProperties": {
      "pricePerUnit": null,
      "fulfillerId": null,
      "shippingGroupId": null,
      "shippingWeightRange": null,
      "pricePerUnitRange": null,
      "weightMeasurementUnitInfo": {
        "weightMeasurementUnit": "KG"
      },
      "deliveryProfileId": null
    },
    "handle": "Product_a7daf3a2-2a31-49b3-8a64-8264cd1006c7",
    "currency": null,
    "breadcrumbsInfo": null,
    "actualPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "compareAtPriceRange": {
      "minValue": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "maxValue": {
        "amount": "0.5",
        "formattedAmount": null
      }
    },
    "variantsInfo": {
      "variants": [
        {
          "id": "75ba03bc-e56f-4b6d-be52-691eb2ed5fd7",
          "visible": true,
          "sku": null,
          "barcode": null,
          "choices": [],
          "price": {
            "actualPrice": {
              "amount": "0.5",
              "formattedAmount": null
            },
            "compareAtPrice": null
          },
          "revenueDetails": null,
          "media": null,
          "subscriptionPricesInfo": null,
          "inventoryStatus": {
            "inStock": false,
            "preorderEnabled": false
          },
          "physicalProperties": {
            "weight": null,
            "pricePerUnit": null
          }
        }
      ]
    },
    "subscriptionDetails": null,
    "extendedFields": null,
    "seoTitle": null,
    "seoDescription": null,
    "numericId": "1735726394407000",
    "flattenOptions": [],
    "flattenModifiers": [],
    "variantSummary": {
      "variantCount": 1
    },
    "minVariantPriceInfo": {
      "minSubscriptionPrice": null,
      "minSubscriptionPricePerUnit": null,
      "pricePerUnitData": null,
      "sku": null,
      "weight": null,
      "revenueDetails": null,
      "actualPrice": {
        "amount": "0.5",
        "formattedAmount": null
      },
      "compareAtPrice": null
    }
  }
}
Errors
Expand All
403
Permission Denied
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Search Products
Retrieves a list of up to 100 products, given the provided filtering, search expression, sorting, and cursor paging. Pass supported values to the fields array in the request to include those fields in the response.

To learn about working with Search endpoints, see API Query Language, and Sorting and Paging.

Notes:

This method does not return variantsInfo. To retrieve product variants, use the Get Product method.
To retrieve a non-visible product (visible: false), your app must have the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.
Property	Capabilities	Filters
allCategoriesInfo.categories	Search: ✗
Aggregate: ✓
Sort: ✗	$matchItems
directCategoriesInfo.categories	Search: ✗
Aggregate: ✓
Sort: ✗	$matchItems
variantsInfo.variants	Search: ✗
Aggregate: ✓
Sort: ✗	$matchItems
infoSections.id	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
infoSections.uniqueName	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
modifiers.id	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
modifiers.choicesSettings.choices.choiceId	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
modifiers.choicesSettings.choices.name	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
modifiers.name	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
options.id	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
options.choicesSettings.choices.choiceId	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
options.choicesSettings.choices.name	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
options.name	Search: ✗
Aggregate: ✓
Sort: ✗	$hasAll, $hasSome
id	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
brand.id	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
brand.name	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
handle	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
inventory.availabilityStatus	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
inventory.preorderAvailability	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
inventory.preorderStatus	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
physicalProperties.deliveryProfileId	Search: ✓
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
physicalProperties.fulfillerId	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
productType	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
ribbon.id	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
ribbon.name	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
slug	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
subscriptionDetails.allowOneTimePurchases	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
taxGroupId	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
visible	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
visibleInPos	Search: ✗
Aggregate: ✓
Sort: ✗	$eq, $ne, $exists, $in, $any
createdDate	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $lt, $lte, $gt, $gte
updatedDate	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $lt, $lte, $gt, $gte
actualPriceRange.maxValue.amount	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
actualPriceRange.minValue.amount	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
compareAtPriceRange.maxValue.amount	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
compareAtPriceRange.minValue.amount	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
minVariantPriceInfo.sku	Search: ✓
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
name	Search: ✓
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $begins, $gt, $lt, $lte, $gte
physicalProperties.shippingWeightRange.maxValue	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $lt, $lte, $gt, $gte
physicalProperties.shippingWeightRange.minValue	Search: ✗
Aggregate: ✓
Sort: ASC, DESC	$eq, $ne, $exists, $in, $any, $lt, $lte, $gt, $gte
description	Search: ✓
Aggregate: ✗
Sort: ✗	
directCategoryIdsInfo.categoryIds	Search: ✓
Aggregate: ✗
Sort: ✗	
physicalProperties.shippingGroupId	Search: ✓
Aggregate: ✗
Sort: ✗	
variantsInfo.variants.sku	Search: ✓
Aggregate: ✗
Sort: ✗	
Permissions
Read products in v3 catalog
Product v3 read admin
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/products/search
Body Params
search
Search
Search options.

Show Child Properties
fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
products
Array <Product>
List of products.

Show Child Properties
pagingMetadata
PagingMetadata
Paging metadata.

Show Child Properties
aggregationData
AggregationData
Aggregation data.

Show Child Properties
Example shown:
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/products/search' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "fields": [
            "WEIGHT_MEASUREMENT_UNIT_INFO",
            "CURRENCY"
        ],
        "search": {
            "filter": {
                "variantsInfo.variants": {
                    "$matchItems": [
                        {
                            "visible": {
                                "$eq": true
                            }
                        },
                        {
                            "price.actualPrice.amount": {
                                "$gt": 1
                            }
                        },
                        {
                            "price.actualPrice.amount": {
                                "$lt": 100
                            }
                        },
                        {
                            "sku": {
                                "$eq": "5555"
                            }
                        },
                        {
                            "barcode": {
                                "$eq": "987"
                            }
                        },
                        {
                            "choices.optionChoiceIds.optionId": {
                                "$hasSome": [
                                    "3e85ff44-3763-4946-b9f3-993fd4c5c771"
                                ]
                            }
                        },
                        {
                            "choices.optionChoiceIds.choiceId": {
                                "$hasSome": [
                                    "0b649a04-b73b-492e-b3c9-315c621b5bd8"
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }'
Response
JSON
{
  "products": [
    {
      "id": "86c2ac9b-d93f-489c-bfbf-056bb710c276",
      "revision": "1",
      "createdDate": "2025-01-02T09:02:37.777Z",
      "updatedDate": "2025-01-02T09:02:40.074Z",
      "name": "Apples",
      "slug": "apples",
      "url": null,
      "description": null,
      "plainDescription": null,
      "visible": true,
      "visibleInPos": true,
      "media": {
        "main": null,
        "itemsInfo": null
      },
      "seoData": null,
      "taxGroupId": null,
      "options": [
        {
          "id": "3e85ff44-3763-4946-b9f3-993fd4c5c771",
          "name": "Size",
          "optionRenderType": "TEXT_CHOICES",
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "0b649a04-b73b-492e-b3c9-315c621b5bd8",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "s",
                "name": "s",
                "inStock": false,
                "visible": true
              },
              {
                "choiceId": "15ef4e3a-d501-493b-a1ae-51456378cba7",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "l",
                "name": "l",
                "inStock": false,
                "visible": true
              }
            ]
          },
          "key": "Size"
        }
      ],
      "modifiers": [],
      "brand": {
        "id": "10f3067e-5109-438f-baf0-30b80ad3ab14",
        "name": "granny smith"
      },
      "infoSections": [],
      "ribbon": null,
      "directCategoriesInfo": null,
      "allCategoriesInfo": null,
      "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
      "directCategoryIdsInfo": null,
      "costRange": null,
      "inventory": {
        "preorderAvailability": "NO_VARIANTS",
        "availabilityStatus": "OUT_OF_STOCK",
        "preorderStatus": "DISABLED"
      },
      "productType": "PHYSICAL",
      "physicalProperties": {
        "pricePerUnit": null,
        "fulfillerId": null,
        "shippingGroupId": null,
        "shippingWeightRange": null,
        "pricePerUnitRange": null,
        "weightMeasurementUnitInfo": {
          "weightMeasurementUnit": "KG"
        },
        "deliveryProfileId": null
      },
      "handle": "Product_afcc2f71-d90a-4fd7-9539-b53fcf4e803e",
      "currency": "USD",
      "breadcrumbsInfo": null,
      "actualPriceRange": {
        "minValue": {
          "amount": "16.00",
          "formattedAmount": "$16.00"
        },
        "maxValue": {
          "amount": "20.00",
          "formattedAmount": "$20.00"
        }
      },
      "compareAtPriceRange": {
        "minValue": {
          "amount": "16.00",
          "formattedAmount": "$16.00"
        },
        "maxValue": {
          "amount": "25.00",
          "formattedAmount": "$25.00"
        }
      },
      "variantsInfo": null,
      "subscriptionDetails": null,
      "extendedFields": null,
      "seoTitle": null,
      "seoDescription": null,
      "numericId": "1735808557728000",
      "flattenOptions": [],
      "flattenModifiers": [],
      "variantSummary": {
        "variantCount": 2
      },
      "minVariantPriceInfo": null
    }
  ],
  "pagingMetadata": {
    "count": 1,
    "cursors": {
      "next": null,
      "prev": null
    },
    "hasNext": false
  },
  "aggregationData": null
}
Errors
Expand All
403
Permission Denied
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Query Products
Retrieves a list of up to 100 products, given the provided filtering, sorting, and cursor paging. Pass supported values to the fields array in the request to include those fields in the response.

To learn about working with Query endpoints, see API Query Language, and Sorting and Paging.

Notes:

This method does not return variantsInfo. To retrieve product variants, use the Get Product method.
To retrieve a non-visible product (visible: false), your app must have the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.
Permissions
Read products in v3 catalog
Product v3 read admin
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/products/query
Body Params
query
Query
Query options.

Show Child Properties
fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
products
Array <Product>
List of products.

Show Child Properties
pagingMetadata
PagingMetadata
Paging metadata.

Show Child Properties
Example shown:
Query Products
Query Products with filter by ids and sort by creation date

Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/products/query' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "fields": [],
      "query": {
        "sort": [
          {
            "order": "ASC",
            "field_name": "createdDate"
          }
        ],
        "filter": {
          "id": {
            "$in": [
              "dd093852-35c6-4e09-a22c-4a5f175b2b1c",
              "35bb39e5-83aa-4930-b5c4-54db7b886a6e"
            ]
          }
        }
      }
    }'
Response
JSON
{
  "products": [
    {
      "id": "35bb39e5-83aa-4930-b5c4-54db7b886a6e",
      "revision": "1",
      "createdDate": "2025-01-01T13:43:49.222Z",
      "updatedDate": "2025-01-01T13:43:51.660Z",
      "name": "Chocolate bar",
      "slug": "chocolate-bar-6",
      "url": null,
      "description": null,
      "plainDescription": null,
      "visible": false,
      "visibleInPos": true,
      "media": {
        "main": null,
        "itemsInfo": null
      },
      "seoData": null,
      "taxGroupId": null,
      "options": [],
      "modifiers": [],
      "brand": null,
      "infoSections": [],
      "ribbon": null,
      "directCategoriesInfo": null,
      "allCategoriesInfo": null,
      "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
      "directCategoryIdsInfo": null,
      "costRange": null,
      "inventory": {
        "preorderAvailability": "NO_VARIANTS",
        "availabilityStatus": "OUT_OF_STOCK",
        "preorderStatus": "DISABLED"
      },
      "productType": "PHYSICAL",
      "physicalProperties": {
        "pricePerUnit": null,
        "fulfillerId": null,
        "shippingGroupId": null,
        "shippingWeightRange": null,
        "pricePerUnitRange": null,
        "weightMeasurementUnitInfo": null,
        "deliveryProfileId": null
      },
      "handle": "Product_9e11b825-593c-4246-9ea9-cf48aec71361",
      "currency": null,
      "breadcrumbsInfo": null,
      "actualPriceRange": {
        "minValue": {
          "amount": "6",
          "formattedAmount": null
        },
        "maxValue": {
          "amount": "6",
          "formattedAmount": null
        }
      },
      "compareAtPriceRange": {
        "minValue": {
          "amount": "7",
          "formattedAmount": null
        },
        "maxValue": {
          "amount": "7",
          "formattedAmount": null
        }
      },
      "variantsInfo": null,
      "subscriptionDetails": null,
      "extendedFields": null,
      "seoTitle": null,
      "seoDescription": null,
      "numericId": "1735739029162001",
      "flattenOptions": [],
      "flattenModifiers": [],
      "variantSummary": {
        "variantCount": 1
      },
      "minVariantPriceInfo": null
    },
    {
      "id": "dd093852-35c6-4e09-a22c-4a5f175b2b1c",
      "revision": "1",
      "createdDate": "2025-01-01T13:43:49.222Z",
      "updatedDate": "2025-01-01T13:43:52.324Z",
      "name": "Coffee",
      "slug": "coffee-3",
      "url": null,
      "description": null,
      "plainDescription": null,
      "visible": true,
      "visibleInPos": true,
      "media": {
        "main": null,
        "itemsInfo": null
      },
      "seoData": null,
      "taxGroupId": null,
      "options": [],
      "modifiers": [],
      "brand": null,
      "infoSections": [],
      "ribbon": null,
      "directCategoriesInfo": null,
      "allCategoriesInfo": null,
      "mainCategoryId": "1aecdc65-176f-4f07-a846-77a8d5079eb5",
      "directCategoryIdsInfo": null,
      "costRange": null,
      "inventory": {
        "preorderAvailability": "NO_VARIANTS",
        "availabilityStatus": "OUT_OF_STOCK",
        "preorderStatus": "DISABLED"
      },
      "productType": "PHYSICAL",
      "physicalProperties": {
        "pricePerUnit": null,
        "fulfillerId": null,
        "shippingGroupId": null,
        "shippingWeightRange": null,
        "pricePerUnitRange": null,
        "weightMeasurementUnitInfo": null,
        "deliveryProfileId": null
      },
      "handle": "Product_33ea6950-e6e3-4155-9ef6-8f4a90022a94",
      "currency": null,
      "breadcrumbsInfo": null,
      "actualPriceRange": {
        "minValue": {
          "amount": "10",
          "formattedAmount": null
        },
        "maxValue": {
          "amount": "10",
          "formattedAmount": null
        }
      },
      "compareAtPriceRange": {
        "minValue": {
          "amount": "10",
          "formattedAmount": null
        },
        "maxValue": {
          "amount": "10",
          "formattedAmount": null
        }
      },
      "variantsInfo": null,
      "subscriptionDetails": null,
      "extendedFields": null,
      "seoTitle": null,
      "seoDescription": null,
      "numericId": "1735739029162000",
      "flattenOptions": [],
      "flattenModifiers": [],
      "variantSummary": {
        "variantCount": 1
      },
      "minVariantPriceInfo": null
    }
  ],
  "pagingMetadata": {
    "count": 2,
    "cursors": {
      "next": null,
      "prev": null
    },
    "hasNext": false
  }
}
Errors
Expand All
403
Permission Denied
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Count Products
Counts the number of products that match the provided filtering.

Permissions
Read products in v3 catalog
Product v3 read admin
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/products/count
Body Params
filter
Filter
Filter object.

Show Child Properties
search
Search
Free text to match in searchable fields.

Show Child Properties
returnNonVisibleProducts
boolean
Whether to return non-visible products (visible:false). Your app must have the required SCOPE.STORES.PRODUCT_READ_ADMIN permission scope.

Default: false

Response Object
count
integer
Total number of products.

Example shown:
CountProducts that satisfy filter or search
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/products/count' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "$and": [
        {
          "allCategoriesInfo.categories": {
            "$matchItems": [
              {
                "id": {
                  "$eq": "643721c3-446e-47f3-87ee-0a58d6842d48"
                }
              }
            ]
          }
        },
        {
          "productType": {
            "$eq": "PHYSICAL"
          }
        },
        {
          "visible": {
            "$eq": false
          }
        },
        {
          "brand.id": {
            "$eq": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd"
          }
        },
        {
          "infoSections.id": {
            "$hasSome": [
              "59954f23-fbcd-42e5-ba61-7c8cf9d8b409"
            ]
          }
        },
        {
          "actualPriceRange.minValue.amount": {
            "$gt": 3
          }
        },
        {
          "actualPriceRange.minValue.amount": {
            "$lt": 120
          }
        },
        {
          "inventory.availabilityStatus": {
            "$in": [
              "OUT_OF_STOCK",
              "PARTIALLY_OUT_OF_STOCK"
            ]
          }
        },
        {
          "options.choicesSettings.choices.choiceId": {
            "$hasSome": [
              "4498b805-2aed-43fb-b478-989c906c19cd"
            ]
          }
        }
      ]
    }'
Response
JSON
{
  "count": 1
}
Errors
Expand All
403
Permission Denied
There are 2 errors with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Bulk Update Product Variants By Filter
Updates a variant of multiple products, given the provided filter and search expression.

Only the following variant fields can be updated:

visible
price
revenueDetails.cost
physicalOptions
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/update-variants-by-filter
Body Params
filter
Filter
Required
Filter object.

Show Child Properties
variant
Variant
Required
Variant to update.

Show Child Properties
search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk update product variants by filter
This example contains all fields that allowed in this method. All variants of all products that satisfy a filter will be updated.

Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/update-variants-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "filter": {
        "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1"
      },
      "variant": {
        "choices": [],
        "visible": false,
        "price": {
          "compareAtPrice": {
            "amount": "7"
          },
          "actualPrice": {
            "amount": "6"
          }
        },
        "revenueDetails": {
          "cost": {
            "amount": "5"
          }
        },
        "physicalProperties": {
          "weight": "0.1",
          "pricePerUnit": {
            "settings": {
              "quantity": "0.5",
              "measurementUnit": "KG"
            }
          }
        }
      }
    }'
Response
JSON
{
  "jobId": "c7ff5d9d-1dea-482b-a367-f00216d03871"
}
Errors
Expand All
400
Invalid Argument
There are 4 errors with this status code.


Show
409
Already Exists
There is 1 error with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Adjust Product Variants By Filter
Adjusts the price and cost of multiple variants, given the provided filter and search expression.

Only the following variant fields can be increased/decreased by amount or percentage:

compareAtPrice
actualPrice
cost
compareAtPriceDiscount
Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/adjust-variants-by-filter
Body Params
filter
Filter
Required
Filter object.

Show Child Properties
cost
Cost
Cost adjustment.

Show Child Properties
rounding
string
Rounding strategy of new calculated prices.

NO_ROUNDING: Calculated prices will be saved without rounding to keep max possible precision.
CURRENCY_PRECISION: Calculated prices will be rounded according to the currency's precision requirements. For example. $3.5555 will be saved as $3.56; ¥3.5555 will be saved as ¥4.
NEAREST_WHOLE_NUMBER: Calculated prices will be rounded to the nearest whole number.
Show Enum Values
search
Search
Free text to match in searchable fields.

Show Child Properties
actualPrice
ActualPrice
Actual price adjustment.

Show Child Properties
compareAtPrice
CompareAtPrice
Compare at price adjustment.

Show Child Properties
compareAtPriceDiscount
CompareAtPriceDiscount
Set variant actualPrice from compareAtPrice by applying provided discount to it. if compare-at-price doesn't exist, actualPrice will be set to compareAtPrice and the discount will be calculated from it. For example variant compareAtPrice 100$, variant actualPrice is 95$, requested compareAtPriceDiscount.percentage is 10, then old actual price ignored and new actual price set to 90 (100$ - 10%).

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk adjust product variants by filter
Decreases the actual price, compare at price, and cost of all product variants that were created after July 22nd, 2024.

Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/adjust-variants-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "filter": {
        "createdDate": {
          "$gt": "2024-07-22T13:22:45"
        }
      },
      "actualPrice": {
        "amount": "-1"
      },
      "compareAtPrice": {
        "amount": "-1"
      },
      "cost": {
        "amount": "-1"
      }
    }'
Response
JSON
{
  "jobId": "e95725e2-9159-4d45-b1c5-d3a0fed56d7b"
}
Errors
Expand All
400
Invalid Argument
There are 5 errors with this status code.


Show
428
Failed Precondition
There is 1 error with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Add Info Sections To Products By Filter
Adds info sections to multiple products, given the provided filter and search expression.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/add-info-sections-by-filter
Body Params
filter
Filter
Required
Filter object.

Show Child Properties
infoSectionIds
Array <string>
Required
format GUID
minItems 1
maxItems 10
IDs of the info sections to add.

search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk add info sections to products by filter
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/add-info-sections' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "filter": {
            "createdDate": {
                "$gt": "2024-07-22T13:22:45"
            }
        },
        "infoSectionIds": [
            "b9b39003-0edd-41c0-9403-a0fe19cc5bb4",
            "1dac2b73-3592-4d80-9a6e-4892caf4e058"
        ]
    }'
Response
JSON
{
  "jobId": "6ed9c722-a611-4f38-8b7d-1f2221e914ca"
}
Errors
Expand All
428
Failed Precondition
There is 1 error with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Add Info Sections To Products
Adds info sections to multiple products.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/add-info-sections
Body Params
products
Array <ProductIdWithRevision>
Required
minItems 1
maxItems 100
List of product IDs and revisions.

Show Child Properties
infoSectionIds
Array <string>
Required
format GUID
minItems 1
maxItems 10
List of IDs of info sections to add.

returnEntity
boolean
Whether to return the full updated product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
results
Array <BulkProductResult>
minItems 1
maxItems 100
Products updated by bulk action.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Bulk add info sections to products
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/add-info-sections' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
      "fields": [
      ],
      "infoSectionIds": [
        "b9b39003-0edd-41c0-9403-a0fe19cc5bb4",
        "1dac2b73-3592-4d80-9a6e-4892caf4e058"
      ],
      "products": [
        {
          "productId": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
          "revision": "8"
        },
        {
          "productId": "abc62281-87b7-47e8-98ba-20e25341ad98",
          "revision": "5"
        }
      ],
      "returnEntity": true
    }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
        "originalIndex": 0,
        "success": true
      },
      "item": {
        "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
        "revision": "9",
        "createdDate": "2024-07-22T13:22:47.771Z",
        "updatedDate": "2024-07-22T16:38:05.649Z",
        "name": "Premium Coffee",
        "slug": "coffee",
        "visible": false,
        "visibleInPos": false,
        "media": {
          "main": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "image": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "height": 1200,
              "width": 1200,
              "filename": "food.jpeg",
              "sizeInBytes": "116752"
            },
            "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
          },
          "items": [
            {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            {
              "id": "370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
              "image": {
                "id": "370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_8412ab11b3ad48bb8375a2ecb1cc8b4d~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "44682905-395a-4c18-8fab-e050725ba3f6"
            }
          ]
        },
        "options": [
          {
            "id": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
            "name": "Size",
            "optionRenderType": "TEXT_CHOICES",
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "S",
                  "name": "S",
                  "inStock": true
                },
                {
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "L",
                  "name": "L",
                  "inStock": false
                }
              ]
            },
            "key": "Size"
          },
          {
            "id": "1938d364-126d-4304-b706-9e9e9f6d376f",
            "name": "Box color",
            "optionRenderType": "SWATCH_CHOICES",
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60",
                  "linkedMedia": [],
                  "choiceType": "ONE_COLOR",
                  "key": "red",
                  "name": "red",
                  "colorCode": "#FF0000",
                  "inStock": true
                },
                {
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6",
                  "linkedMedia": [],
                  "choiceType": "ONE_COLOR",
                  "key": "blue",
                  "name": "blue",
                  "colorCode": "#0000FF",
                  "inStock": false
                }
              ]
            },
            "key": "Box color"
          }
        ],
        "modifiers": [
          {
            "id": "a3d249f0-a8da-425d-9ec1-3c51c795d927",
            "name": "Remove price tag",
            "modifierRenderType": "TEXT_CHOICES",
            "mandatory": false,
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "3050481e-e177-4031-bbe9-be9b00af14b5",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "yes",
                  "name": "yes"
                },
                {
                  "choiceId": "ee729b74-d500-4594-aae5-b5a2e75bf5e7",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "no",
                  "name": "no"
                }
              ]
            },
            "key": "Remove price tag"
          }
        ],
        "brand": {
          "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd",
          "name": "EcoCoffee"
        },
        "infoSections": [
          {
            "id": "1dac2b73-3592-4d80-9a6e-4892caf4e058"
          },
          {
            "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409"
          },
          {
            "id": "b9b39003-0edd-41c0-9403-a0fe19cc5bb4"
          }
        ],
        "ribbon": {
          "id": "14585597-3302-4145-8da3-24a26d8346d6",
          "name": "New arrival"
        },
        "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
        "compareAtPriceRange": {
          "minValue": {
            "amount": "6"
          },
          "maxValue": {
            "amount": "6"
          }
        },
        "actualPriceRange": {
          "minValue": {
            "amount": "5"
          },
          "maxValue": {
            "amount": "5"
          }
        },
        "inventory": {
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderAvailability": "NO_VARIANTS",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": {
            "quantity": 1.0,
            "measurementUnit": "KG"
          },
          "shippingWeightRange": {
            "minValue": 0.1,
            "maxValue": 0.1
          }
        },
        "flattenOptions": [],
        "flattenModifiers": []
      }
    },
    {
      "itemMetadata": {
        "id": "abc62281-87b7-47e8-98ba-20e25341ad98",
        "originalIndex": 1,
        "success": true
      },
      "item": {
        "id": "abc62281-87b7-47e8-98ba-20e25341ad98",
        "revision": "6",
        "createdDate": "2024-07-22T14:04:05.787Z",
        "updatedDate": "2024-07-22T16:38:05.649Z",
        "name": "Recyclable Shopping bag",
        "slug": "shopping-bag",
        "visible": true,
        "visibleInPos": true,
        "media": {
          "items": []
        },
        "options": [],
        "modifiers": [],
        "infoSections": [
          {
            "id": "1dac2b73-3592-4d80-9a6e-4892caf4e058"
          },
          {
            "id": "b9b39003-0edd-41c0-9403-a0fe19cc5bb4"
          }
        ],
        "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
        "compareAtPriceRange": {
          "minValue": {
            "amount": "0.5"
          },
          "maxValue": {
            "amount": "0.5"
          }
        },
        "actualPriceRange": {
          "minValue": {
            "amount": "0.5"
          },
          "maxValue": {
            "amount": "0.5"
          }
        },
        "inventory": {
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderAvailability": "NO_VARIANTS",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {},
        "flattenOptions": [],
        "flattenModifiers": []
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
Expand All
428
Failed Precondition
There is 1 error with this status code.


Show
This method may also return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Remove Info Sections From Products By Filter
Removes info sections from multiple products, given the provided filter and search expression.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/remove-info-sections-by-filter
Body Params
filter
Filter
Required
Filter object.

Show Child Properties
infoSectionIds
Array <string>
Required
format GUID
minItems 1
maxItems 100
IDs of info sections to remove.

search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk remove info sections to products by filter
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/remove-info-sections-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "filter": {
            "createdDate": {
                "$gt": "2024-07-22T13:22:45"
            }
        },
        "infoSectionIds": [
            "b9b39003-0edd-41c0-9403-a0fe19cc5bb4",
            "1dac2b73-3592-4d80-9a6e-4892caf4e058"
        ]
    }'
Response
JSON
{
  "jobId": "3ab904a4-d0d5-4e9f-8f48-d9f25bd7178d"
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Remove Info Sections From Products
Removes info sections from multiple products.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Product write in v3 catalog
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/remove-info-sections
Body Params
products
Array <ProductIdWithRevision>
Required
minItems 1
maxItems 100
List of product IDs and revisions.

Show Child Properties
infoSectionIds
Array <string>
Required
format GUID
minItems 1
maxItems 100
List of IDs of info sections to remove.

returnEntity
boolean
Whether to return the full updated product entities in the response.

Default: false

fields
Array <string>
maxItems 100
Fields to include in the response.

Show Enum Values
Response Object
results
Array <BulkProductResult>
minItems 1
maxItems 100
Products updated by bulk action.

Show Child Properties
bulkActionMetadata
BulkActionMetadata
Bulk action metadata.

Show Child Properties
Example shown:
Bulk remove info sections to products
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/remove-info-sections' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
          "fields": [
          ],
          "infoSectionIds": [
            "b9b39003-0edd-41c0-9403-a0fe19cc5bb4",
            "1dac2b73-3592-4d80-9a6e-4892caf4e058"
          ],
          "products": [
            {
              "productId": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
              "revision": "11"
            },
            {
              "productId": "abc62281-87b7-47e8-98ba-20e25341ad98",
              "revision": "8"
            }
          ],
          "returnEntity": true
        }'
Response
JSON
{
  "results": [
    {
      "itemMetadata": {
        "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
        "originalIndex": 0,
        "success": true
      },
      "item": {
        "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
        "revision": "12",
        "createdDate": "2024-07-22T13:22:47.771Z",
        "updatedDate": "2024-07-22T16:40:50.698Z",
        "name": "Premium Coffee",
        "slug": "coffee",
        "visible": false,
        "visibleInPos": false,
        "media": {
          "main": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "image": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "height": 1200,
              "width": 1200,
              "filename": "food.jpeg",
              "sizeInBytes": "116752"
            },
            "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
          }
        },
        "options": [
          {
            "id": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
            "name": "Size",
            "optionRenderType": "TEXT_CHOICES",
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "S",
                  "name": "S",
                  "inStock": true
                },
                {
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "L",
                  "name": "L",
                  "inStock": false
                }
              ]
            },
            "key": "Size"
          },
          {
            "id": "1938d364-126d-4304-b706-9e9e9f6d376f",
            "name": "Box color",
            "optionRenderType": "SWATCH_CHOICES",
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60",
                  "linkedMedia": [],
                  "choiceType": "ONE_COLOR",
                  "key": "red",
                  "name": "red",
                  "colorCode": "#FF0000",
                  "inStock": true
                },
                {
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6",
                  "linkedMedia": [],
                  "choiceType": "ONE_COLOR",
                  "key": "blue",
                  "name": "blue",
                  "colorCode": "#0000FF",
                  "inStock": false
                }
              ]
            },
            "key": "Box color"
          }
        ],
        "modifiers": [
          {
            "id": "a3d249f0-a8da-425d-9ec1-3c51c795d927",
            "name": "Remove price tag",
            "modifierRenderType": "TEXT_CHOICES",
            "mandatory": false,
            "choicesSettings": {
              "choices": [
                {
                  "choiceId": "3050481e-e177-4031-bbe9-be9b00af14b5",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "yes",
                  "name": "yes"
                },
                {
                  "choiceId": "ee729b74-d500-4594-aae5-b5a2e75bf5e7",
                  "linkedMedia": [],
                  "choiceType": "CHOICE_TEXT",
                  "key": "no",
                  "name": "no"
                }
              ]
            },
            "key": "Remove price tag"
          }
        ],
        "brand": {
          "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd",
          "name": "EcoCoffee"
        },
        "infoSections": [
          {
            "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409"
          }
        ],
        "ribbon": {
          "id": "14585597-3302-4145-8da3-24a26d8346d6",
          "name": "New arrival"
        },
        "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
        "compareAtPriceRange": {
          "minValue": {
            "amount": "6"
          },
          "maxValue": {
            "amount": "6"
          }
        },
        "actualPriceRange": {
          "minValue": {
            "amount": "5"
          },
          "maxValue": {
            "amount": "5"
          }
        },
        "inventory": {
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderAvailability": "NO_VARIANTS",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {
          "pricePerUnit": {
            "quantity": 1.0,
            "measurementUnit": "KG"
          },
          "shippingWeightRange": {
            "minValue": 0.1,
            "maxValue": 0.1
          }
        }
      }
    },
    {
      "itemMetadata": {
        "id": "abc62281-87b7-47e8-98ba-20e25341ad98",
        "originalIndex": 1,
        "success": true
      },
      "item": {
        "id": "abc62281-87b7-47e8-98ba-20e25341ad98",
        "revision": "9",
        "createdDate": "2024-07-22T14:04:05.787Z",
        "updatedDate": "2024-07-22T16:40:50.698Z",
        "name": "Recyclable Shopping bag",
        "slug": "shopping-bag",
        "visible": true,
        "visibleInPos": true,
        "media": {},
        "options": [],
        "modifiers": [],
        "infoSections": [],
        "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
        "compareAtPriceRange": {
          "minValue": {
            "amount": "0.5"
          },
          "maxValue": {
            "amount": "0.5"
          }
        },
        "actualPriceRange": {
          "minValue": {
            "amount": "0.5"
          },
          "maxValue": {
            "amount": "0.5"
          }
        },
        "inventory": {
          "availabilityStatus": "OUT_OF_STOCK",
          "preorderAvailability": "NO_VARIANTS",
          "preorderStatus": "DISABLED"
        },
        "productType": "PHYSICAL",
        "physicalProperties": {}
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

Event Triggers
This method triggers the following events:
Product Updated
Did this help?

Yes

No
POST
Bulk Add Products To Categories By Filter
Adds multiple products, given the provided filter and search expression, to up to 5 categories.

Learn more about the Categories API.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Category item write
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/add-to-categories-by-filter
Body Params
filter
Filter
Filter object.

Show Child Properties
categoryIds
Array <string>
Required
format GUID
minItems 1
maxItems 5
IDs of the categories to which products will be added.

search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk add products to categories by filter
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/add-to-categories-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "categoryIds": [
            "7a083f69-3d3e-4cfd-a3ef-43fe68e967e5"
        ],
        "filter": {
            "productType": "PHYSICAL"
        },
        "search": {
            "expression": "Summer"
        }
    }'
Response
JSON
{
  "jobId": "b201b3e0-c8f5-413b-8128-2b4af598c71d"
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
POST
Bulk Remove Products From Categories By Filter
Removes multiple products, given the provided filter and search expression, from up to 5 categories.

Learn more about the Categories API.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Category item write
Learn more about 
.
Endpoint
POST
https://www.wixapis.com/stores/v3/bulk/products/remove-from-categories-by-filter
Body Params
filter
Filter
Filter object.

Show Child Properties
categoryIds
Array <string>
Required
format GUID
minItems 1
maxItems 5
IDs of the categories from which products will be removed.

search
Search
Free text to match in searchable fields.

Show Child Properties
Response Object
jobId
string
format GUID
Job ID.

Pass this ID to Get Async Job to retrieve job details and metadata..

Example shown:
Bulk remove products from categories by filter
Request
cURL
curl POST 'https://www.wixapis.com/stores/v3/bulk/products/remove-from-categories-by-filter' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
-d '{
        "categoryIds": [
            "7a083f69-3d3e-4cfd-a3ef-43fe68e967e5"
        ],
        "filter": {
            "productType": "PHYSICAL"
        },
        "search": {
            "expression": "Summer"
        }
    }'
Response
JSON
{
  "jobId": "98b3f70d-f632-45e6-89a8-b860e0431f0d"
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
GET
Get All Products Category
Retrieves the id of "All Products" category which is automatically assigned to all products.

Permissions
Read v3 catalog
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/stores/v3/all-products-category
Request
This endpoint does not take any parameters.
Response Object
categoryId
string
format GUID

Id of the "All Products" category automatically assigned to all products.

treeReference
TreeReference
Category tree reference details.

Show Child Properties
Example shown:
Get all-products category id and tree reference
Request
cURL
curl GET 'https://www.wixapis.com/stores/v3/all-products-category' \
-H 'Content-Type: application/json' \
-H 'Authorization: <AUTH>' \
Response
JSON
{
  "categoryId": "894d495b-57d7-41ce-98a5-1320542731dd",
  "treeReference": {
    "appNamespace": "@wix/stores"
  }
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
Product Created
Permissions
Read products in v3 catalog
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
id
string
Unique event ID. Allows clients to ignore duplicate events.

entityFqdn
string
Fully qualified domain name of the entity associated with the event. Expected wix.stores.catalog.v3.product.

slug
string
Event name. Expected created.

entityId
string
ID of the entity associated with the event.

eventTime
string
format date-time
Event timestamp.

triggeredByAnonymizeRequest
boolean
Whether the event was triggered as a result of a privacy regulation compliance, such as GDPR.

originatedFrom
string
If present, indicates the action that triggered the event.

createdEvent
CreatedEvent
Event information.

Show Child Properties
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "wix.stores.catalog.v3.product_created",
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
ProductCreated
JSON
{
  "id": "4ae86daa-0f77-463c-a0ad-9f25fb50929e",
  "entityFqdn": "wix.stores.catalog.v3.product",
  "slug": "created",
  "entityId": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
  "createdEvent": {
    "entityAsJson": {
      "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
      "revision": "1",
      "createdDate": "2024-07-22T13:22:47.771Z",
      "updatedDate": "2024-07-22T13:22:47.771Z",
      "name": "Coffee",
      "slug": "coffee",
      "url": {
        "relativePath": "/product-page/coffee",
        "url": "https://my.wixsite.com/food-store/product-page/coffee"
      },
      "description": {
        "nodes": [
          {
            "type": "PARAGRAPH",
            "id": "foo",
            "nodes": [
              {
                "type": "TEXT",
                "id": "",
                "nodes": [],
                "textData": {
                  "text": "Tasty and eco friendly, in a beautiful gift box.",
                  "decorations": []
                }
              }
            ],
            "paragraphData": {
              "textStyle": {
                "textAlignment": "AUTO"
              }
            }
          }
        ],
        "metadata": {
          "version": 1,
          "id": "fb97b2c1-a3ff-4319-be5f-bbb7fdf0776c"
        }
      },
      "plainDescription": "<p>Tasty and eco friendly, in a beautiful gift box.</p>",
      "visible": true,
      "visibleInPos": true,
      "media": {
        "main": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "itemsInfo": {
          "items": [
            {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            {
              "url": "https://example.jpeg",
              "uploadId": "44682905-395a-4c18-8fab-e050725ba3f6"
            }
          ]
        }
      },
      "options": [
        {
          "id": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
          "name": "Size",
          "optionRenderType": "TEXT_CHOICES",
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "S",
                "name": "S",
                "inStock": true
              },
              {
                "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "L",
                "name": "L",
                "inStock": false
              }
            ]
          },
          "key": "Size"
        },
        {
          "id": "1938d364-126d-4304-b706-9e9e9f6d376f",
          "name": "Box color",
          "optionRenderType": "SWATCH_CHOICES",
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60",
                "linkedMedia": [],
                "choiceType": "ONE_COLOR",
                "key": "red",
                "name": "red",
                "colorCode": "#FF0000",
                "inStock": true
              },
              {
                "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6",
                "linkedMedia": [],
                "choiceType": "ONE_COLOR",
                "key": "blue",
                "name": "blue",
                "colorCode": "#0000FF",
                "inStock": false
              }
            ]
          },
          "key": "Box color"
        }
      ],
      "modifiers": [
        {
          "id": "1d628610-6963-43c0-862a-f823142b00a0",
          "name": "Engraving",
          "modifierRenderType": "FREE_TEXT",
          "mandatory": false,
          "freeTextSettings": {
            "minCharCount": 0,
            "maxCharCount": 499,
            "title": "Would you like to engrave something on the box?",
            "key": "Would you like to engrave something on the box?"
          },
          "key": "Engraving"
        },
        {
          "id": "a3d249f0-a8da-425d-9ec1-3c51c795d927",
          "name": "Remove price tag",
          "modifierRenderType": "TEXT_CHOICES",
          "mandatory": false,
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "3050481e-e177-4031-bbe9-be9b00af14b5",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "yes",
                "name": "yes"
              },
              {
                "choiceId": "ee729b74-d500-4594-aae5-b5a2e75bf5e7",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "no",
                "name": "no"
              }
            ]
          },
          "key": "Remove price tag"
        }
      ],
      "brand": {
        "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd",
        "name": "EcoCoffee"
      },
      "infoSections": [
        {
          "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409",
          "uniqueName": "Coffee refund",
          "title": "Refund policy",
          "description": {
            "nodes": [
              {
                "type": "PARAGRAPH",
                "id": "xjkk51429",
                "nodes": [
                  {
                    "type": "TEXT",
                    "id": "",
                    "nodes": [],
                    "textData": {
                      "text": "2 weeks full refund unless you asked for engraving ",
                      "decorations": []
                    }
                  }
                ],
                "paragraphData": {}
              }
            ],
            "metadata": {
              "version": 1
            },
            "documentStyle": {}
          },
          "plainDescription": "<p>2 weeks full refund unless you asked for engraving </p>"
        }
      ],
      "ribbon": {
        "id": "826aec2a-771b-45a6-9f72-392da18fd3bf",
        "name": "best seller"
      },
      "directCategoriesInfo": {
        "categories": []
      },
      "allCategoriesInfo": {
        "categories": []
      },
      "compareAtPriceRange": {
        "minValue": {
          "amount": "10",
          "formattedAmount": "$10.00"
        },
        "maxValue": {
          "amount": "15",
          "formattedAmount": "$15.00"
        }
      },
      "actualPriceRange": {
        "minValue": {
          "amount": "9",
          "formattedAmount": "$9.00"
        },
        "maxValue": {
          "amount": "15",
          "formattedAmount": "$15.00"
        }
      },
      "costRange": {
        "minValue": {
          "amount": "0.0",
          "formattedAmount": "$0.00"
        },
        "maxValue": {
          "amount": "10",
          "formattedAmount": "$10.00"
        }
      },
      "inventory": {
        "availabilityStatus": "OUT_OF_STOCK",
        "preorderAvailability": "NO_VARIANTS",
        "preorderStatus": "DISABLED"
      },
      "productType": "PHYSICAL",
      "physicalProperties": {
        "pricePerUnit": {
          "quantity": 1.0,
          "measurementUnit": "KG"
        },
        "shippingWeightRange": {
          "minValue": 0.2,
          "maxValue": 0.4
        },
        "weightMeasurementUnitInfo": {
          "weightMeasurementUnit": "KG"
        }
      },
      "currency": "USD",
      "variantsInfo": {
        "variants": [
          {
            "id": "0a186a72-d289-446a-aa51-adf125d30dc6",
            "visible": true,
            "sku": "c-s-r-1111",
            "barcode": "111111111",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "S",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "red",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "10",
                "formattedAmount": "$10.00"
              },
              "actualPrice": {
                "amount": "9",
                "formattedAmount": "$9.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "8",
                "formattedAmount": "$8.00"
              },
              "profit": {
                "amount": "1",
                "formattedAmount": "$1.00"
              },
              "profitMargin": 0.1111
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.2,
              "pricePerUnit": {
                "settings": {
                  "quantity": 150.0,
                  "measurementUnit": "G"
                },
                "value": "60.00",
                "description": "$60.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "5aace0e6-4bab-4d0e-a595-1bcaa01d2377",
            "visible": true,
            "barcode": "111111112",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "S",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "blue",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "10",
                "formattedAmount": "$10.00"
              },
              "actualPrice": {
                "amount": "9.5",
                "formattedAmount": "$9.50"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "8",
                "formattedAmount": "$8.00"
              },
              "profit": {
                "amount": "1.5",
                "formattedAmount": "$1.50"
              },
              "profitMargin": 0.1579
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.2,
              "pricePerUnit": {
                "settings": {
                  "quantity": 150.0,
                  "measurementUnit": "G"
                },
                "value": "63.33",
                "description": "$63.33/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "1d2acec3-5294-4521-a648-6f2ed5f58c43",
            "visible": false,
            "barcode": "111111113",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "L",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "red",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "15",
                "formattedAmount": "$15.00"
              },
              "actualPrice": {
                "amount": "14",
                "formattedAmount": "$14.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "10",
                "formattedAmount": "$10.00"
              },
              "profit": {
                "amount": "4",
                "formattedAmount": "$4.00"
              },
              "profitMargin": 0.2857
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.4,
              "pricePerUnit": {
                "settings": {
                  "quantity": 300.0,
                  "measurementUnit": "G"
                },
                "value": "46.67",
                "description": "$46.67/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "5c390d11-8d35-48e3-8037-428812e0426c",
            "visible": true,
            "barcode": "111111114",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "L",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "blue",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": null,
              "actualPrice": {
                "amount": "15",
                "formattedAmount": "$15.00"
              }
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.4,
              "pricePerUnit": {
                "settings": {
                  "quantity": 300.0,
                  "measurementUnit": "G"
                },
                "value": "50.00",
                "description": "$50.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          }
        ]
      }
    }
  },
  "eventTime": "2024-07-22T13:22:47.923240503Z",
  "triggeredByAnonymizeRequest": false,
  "entityEventSequence": "1"
}
Did this help?

Yes

No
Product Deleted
Triggered when a product is deleted.

Permissions
Read products in v3 catalog
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
id
string
Unique event ID. Allows clients to ignore duplicate events.

entityFqdn
string
Fully qualified domain name of the entity associated with the event. Expected wix.stores.catalog.v3.product.

slug
string
Event name. Expected deleted.

entityId
string
ID of the entity associated with the event.

eventTime
string
format date-time
Event timestamp.

triggeredByAnonymizeRequest
boolean
Whether the event was triggered as a result of a privacy regulation compliance, such as GDPR.

originatedFrom
string
If present, indicates the action that triggered the event.

deletedEvent
struct
Event information.

Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "wix.stores.catalog.v3.product_deleted",
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
ProductDeleted
JSON
{
  "id": "e100bc33-ba14-4c92-948e-416bfb884091",
  "entityFqdn": "wix.stores.catalog.v3.product",
  "slug": "deleted",
  "entityId": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
  "deletedEvent": {
    "movedToTrash": true,
    "deletedEntityAsJson": {
      "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
      "revision": "17",
      "createdDate": "2024-07-22T13:22:47.771Z",
      "updatedDate": "2024-07-22T17:05:33.830Z",
      "name": "Coffee",
      "slug": "coffee",
      "url": {
        "relativePath": "/product-page/coffee",
        "url": "https://my.wixsite.com/food-store/product-page/coffee"
      },
      "description": {
        "nodes": [
          {
            "type": "PARAGRAPH",
            "id": "foo",
            "nodes": [
              {
                "type": "TEXT",
                "id": "",
                "nodes": [],
                "textData": {
                  "text": "Tasty and eco friendly, in a beautiful gift box.",
                  "decorations": []
                }
              }
            ],
            "paragraphData": {
              "textStyle": {
                "textAlignment": "AUTO"
              }
            }
          }
        ],
        "metadata": {
          "version": 1,
          "id": "fb97b2c1-a3ff-4319-be5f-bbb7fdf0776c"
        }
      },
      "plainDescription": "<p>Tasty and eco friendly, in a beautiful gift box.</p>",
      "visible": true,
      "visibleInPos": true,
      "media": {
        "main": {
          "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
          "image": {
            "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
            "height": 1200,
            "width": 1200,
            "filename": "food.jpeg",
            "sizeInBytes": "116752"
          },
          "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
        },
        "itemsInfo": {
          "items": [
            {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            }
          ]
        }
      },
      "options": [
        {
          "id": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
          "name": "Size",
          "optionRenderType": "TEXT_CHOICES",
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "S",
                "name": "S",
                "inStock": true
              },
              {
                "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "L",
                "name": "L",
                "inStock": false
              }
            ]
          },
          "key": "Size"
        },
        {
          "id": "1938d364-126d-4304-b706-9e9e9f6d376f",
          "name": "Box color",
          "optionRenderType": "SWATCH_CHOICES",
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60",
                "linkedMedia": [],
                "choiceType": "ONE_COLOR",
                "key": "red",
                "name": "red",
                "colorCode": "#FF0000",
                "inStock": true
              },
              {
                "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6",
                "linkedMedia": [],
                "choiceType": "ONE_COLOR",
                "key": "blue",
                "name": "blue",
                "colorCode": "#0000FF",
                "inStock": false
              }
            ]
          },
          "key": "Box color"
        }
      ],
      "modifiers": [
        {
          "id": "",
          "name": "Remove price tag",
          "modifierRenderType": "FREE_TEXT",
          "mandatory": false,
          "freeTextSettings": {
            "minCharCount": 0,
            "maxCharCount": 499,
            "title": "Would you like to engrave something on the box?",
            "key": ""
          },
          "key": ""
        },
        {
          "id": "",
          "name": "Remove price tag",
          "modifierRenderType": "TEXT_CHOICES",
          "mandatory": false,
          "choicesSettings": {
            "choices": [
              {
                "choiceId": "",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "",
                "name": "yes"
              },
              {
                "choiceId": "",
                "linkedMedia": [],
                "choiceType": "CHOICE_TEXT",
                "key": "",
                "name": "no"
              }
            ]
          },
          "key": ""
        }
      ],
      "brand": {
        "id": "4a16d28d-1736-41f0-87d8-995f6d9a5bdd",
        "name": "EcoCoffee"
      },
      "infoSections": [
        {
          "id": "59954f23-fbcd-42e5-ba61-7c8cf9d8b409",
          "uniqueName": "Coffee refund",
          "title": "Refund policy",
          "description": {
            "nodes": [
              {
                "type": "PARAGRAPH",
                "id": "xjkk51429",
                "nodes": [
                  {
                    "type": "TEXT",
                    "id": "",
                    "nodes": [],
                    "textData": {
                      "text": "2 weeks full refund unless you asked for engraving ",
                      "decorations": []
                    }
                  }
                ],
                "paragraphData": {}
              }
            ],
            "metadata": {
              "version": 1
            },
            "documentStyle": {}
          },
          "plainDescription": "<p>2 weeks full refund unless you asked for engraving </p>"
        }
      ],
      "ribbon": {
        "id": "826aec2a-771b-45a6-9f72-392da18fd3bf",
        "name": "best seller"
      },
      "directCategoriesInfo": {
        "categories": [
          {
            "id": "643721c3-446e-47f3-87ee-0a58d6842d48"
          }
        ]
      },
      "allCategoriesInfo": {
        "categories": [
          {
            "id": "643721c3-446e-47f3-87ee-0a58d6842d48"
          }
        ]
      },
      "mainCategoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
      "compareAtPriceRange": {
        "minValue": {
          "amount": "6",
          "formattedAmount": "$6.00"
        },
        "maxValue": {
          "amount": "6",
          "formattedAmount": "$6.00"
        }
      },
      "actualPriceRange": {
        "minValue": {
          "amount": "5",
          "formattedAmount": "$5.00"
        },
        "maxValue": {
          "amount": "5",
          "formattedAmount": "$5.00"
        }
      },
      "costRange": {
        "minValue": {
          "amount": "4",
          "formattedAmount": "$4.00"
        },
        "maxValue": {
          "amount": "4",
          "formattedAmount": "$4.00"
        }
      },
      "inventory": {
        "availabilityStatus": "OUT_OF_STOCK",
        "preorderAvailability": "NO_VARIANTS",
        "preorderStatus": "DISABLED"
      },
      "productType": "PHYSICAL",
      "physicalProperties": {
        "pricePerUnit": {
          "quantity": 1.0,
          "measurementUnit": "KG"
        },
        "shippingWeightRange": {
          "minValue": 0.1,
          "maxValue": 0.1
        },
        "weightMeasurementUnitInfo": {
          "weightMeasurementUnit": "KG"
        }
      },
      "currency": "USD",
      "breadcrumbsInfo": {
        "breadcrumbs": [
          {
            "categoryId": "643721c3-446e-47f3-87ee-0a58d6842d48",
            "categoryName": "All Products",
            "categorySlug": "all-products"
          }
        ]
      },
      "variantsInfo": {
        "variants": [
          {
            "id": "0a186a72-d289-446a-aa51-adf125d30dc6",
            "visible": false,
            "sku": "c-s-r-1111",
            "barcode": "111111111",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "S",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "red",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "6",
                "formattedAmount": "$6.00"
              },
              "actualPrice": {
                "amount": "5",
                "formattedAmount": "$5.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "4",
                "formattedAmount": "$4.00"
              },
              "profit": {
                "amount": "1",
                "formattedAmount": "$1.00"
              },
              "profitMargin": 0.1667
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.1,
              "pricePerUnit": {
                "settings": {
                  "quantity": 0.5,
                  "measurementUnit": "KG"
                },
                "value": "10.00",
                "description": "$10.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "5aace0e6-4bab-4d0e-a595-1bcaa01d2377",
            "visible": false,
            "barcode": "111111112",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "4498b805-2aed-43fb-b478-989c906c19cd"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "S",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "blue",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "6",
                "formattedAmount": "$6.00"
              },
              "actualPrice": {
                "amount": "5",
                "formattedAmount": "$5.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "4",
                "formattedAmount": "$4.00"
              },
              "profit": {
                "amount": "1",
                "formattedAmount": "$1.00"
              },
              "profitMargin": 0.1667
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.1,
              "pricePerUnit": {
                "settings": {
                  "quantity": 0.5,
                  "measurementUnit": "KG"
                },
                "value": "10.00",
                "description": "$10.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "1d2acec3-5294-4521-a648-6f2ed5f58c43",
            "visible": false,
            "barcode": "111111113",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "L",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "2e98f13b-ae65-4d30-96c5-ac3a6cf99d60"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "red",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "6",
                "formattedAmount": "$6.00"
              },
              "actualPrice": {
                "amount": "5",
                "formattedAmount": "$5.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "4",
                "formattedAmount": "$4.00"
              },
              "profit": {
                "amount": "1",
                "formattedAmount": "$1.00"
              },
              "profitMargin": 0.1667
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.1,
              "pricePerUnit": {
                "settings": {
                  "quantity": 0.5,
                  "measurementUnit": "KG"
                },
                "value": "10.00",
                "description": "$10.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          },
          {
            "id": "5c390d11-8d35-48e3-8037-428812e0426c",
            "visible": false,
            "barcode": "111111114",
            "choices": [
              {
                "optionChoiceIds": {
                  "optionId": "85bb0544-63c7-431b-9659-f81b18a7dd9f",
                  "choiceId": "26394ab0-d81a-422f-a8c9-562f49a6b595"
                },
                "optionChoiceNames": {
                  "optionName": "Size",
                  "choiceName": "L",
                  "renderType": "TEXT_CHOICES"
                }
              },
              {
                "optionChoiceIds": {
                  "optionId": "1938d364-126d-4304-b706-9e9e9f6d376f",
                  "choiceId": "4876dcc7-817e-4c10-a6b2-4a4cc2e241e6"
                },
                "optionChoiceNames": {
                  "optionName": "Box color",
                  "choiceName": "blue",
                  "renderType": "SWATCH_CHOICES"
                }
              }
            ],
            "price": {
              "compareAtPrice": {
                "amount": "6",
                "formattedAmount": "$6.00"
              },
              "actualPrice": {
                "amount": "5",
                "formattedAmount": "$5.00"
              }
            },
            "revenueDetails": {
              "cost": {
                "amount": "4",
                "formattedAmount": "$4.00"
              },
              "profit": {
                "amount": "1",
                "formattedAmount": "$1.00"
              },
              "profitMargin": 0.1667
            },
            "media": {
              "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
              "image": {
                "id": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "url": "https://static.wixstatic.com/media/370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg",
                "height": 1200,
                "width": 1200,
                "filename": "food.jpeg",
                "sizeInBytes": "116752"
              },
              "uploadId": "370e1a_c65292a0c0584c26aa32d9d921302af9~mv2.jpeg"
            },
            "physicalProperties": {
              "weight": 0.1,
              "pricePerUnit": {
                "settings": {
                  "quantity": 0.5,
                  "measurementUnit": "KG"
                },
                "value": "10.00",
                "description": "$10.00/1 kg"
              }
            },
            "subscriptionPricesInfo": {
              "subscriptionPrices": []
            }
          }
        ]
      }
    }
  },
  "eventTime": "2024-07-22T17:19:37.246315574Z",
  "triggeredByAnonymizeRequest": false,
  "entityEventSequence": "37"
}
Did this help?

Yes

No
Product Updated
Triggered when a product is updated.

Permissions
Read products in v3 catalog
Learn more about 
.
Event Body
Event Body Event data is received as a JSON Web Token (JWT). It may be delayed. Be sure to 
Event Data
id
string
Unique event ID. Allows clients to ignore duplicate events.

entityFqdn
string
Fully qualified domain name of the entity associated with the event. Expected wix.stores.catalog.v3.product.

slug
string
Event name. Expected updated.

entityId
string
ID of the entity associated with the event.

eventTime
string
format date-time
Event timestamp.

triggeredByAnonymizeRequest
boolean
Whether the event was triggered as a result of a privacy regulation compliance, such as GDPR.

originatedFrom
string
If present, indicates the action that triggered the event.

updatedEvent
UpdatedEvent
Event information.

Show Child Properties
Event Body
The data payload will include the following as an encoded JWT:

JSON
{
  "data": {
    "eventType": "wix.stores.catalog.v3.product_updated",
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
ProductUpdated
JSON
{
  "id": "e6a571a2-c522-4826-ae71-6bb99074123a",
  "entityFqdn": "wix.stores.catalog.v3.product",
  "slug": "updated",
  "entityId": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
  "updatedEvent": {
    "currentEntityAsJson": {
      "id": "d17bb5c4-e10f-4b83-ae97-f27f2edc18f1",
      "revision": "2",
      "createdDate": "2024-07-22T13:22:47.771Z",
      "updatedDate": "2024-07-22T13:51:49.970Z",
      "name": "Premium Coffee",
      "slug": "coffee",
      "url": {
        "relativePath": "/product-page/coffee",
        "url": "https://my.wixsite.com/food-store/product-page/coffee"
      },
      "description": {
        "nodes": [
          {
            "type": "PARAGRAPH",
            "id": "foo",
            "nodes": [
              {
                "type": "TEXT",
                "id": "",
                "nodes": [],
                "textData": {
                  "text": "Tasty, high quality and eco friendly, in a beautiful gift box.",
                  "decorations": []
                }
              }
            ],
            "paragraphData": {
              "textStyle": {