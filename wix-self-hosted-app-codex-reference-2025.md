
# Wix Self‑Hosted App — 2025 Codex Reference

# SELFHOSTED WIX 2025 DOCUMENTATION

GET
Get App Instance
Retrieves data about the instance of your app that's installed on a Wix site and data about the site itself. For example, to check whether the Wix user has installed a free or paid version of your app, or to check which apps made by Wix are installed on the site.

You must authenticate this method as a Wix app.

To retrieve site.ownerInfo in the response, you must have the READ SITE OWNER EMAIL permission scope in addition to MANAGE YOUR APP.

Authentication
You can only call this method when authenticated as a Wix app or Wix user identity.

Permissions
Manage Your App
Learn more about 
.
Endpoint
GET
https://www.wixapis.com/apps/v1/instance
Request
This endpoint does not take any parameters.
Response Object
instance
Instance
Retrieved app instance.

Show Child Properties
site
Site
Information about the site.

Show Child Properties
Example shown:
Get App Instance Example 1
Request
cURL
curl -X GET \
 https://www.wixapis.com/apps/v1/instance \
 -H 'Authorization: <AUTH>'
Response
JSON
{
  "instance": {
    "appName": "MY_SHINY_APP",
    "appVersion": "0.0.53",
    "billing": {
      "billingCycle": "MONTHLY",
      "packageName": "e8f429d4-0a6a-468f-8044-87f519a53202",
      "source": "Wix discount coupon"
    },
    "instanceId": "07864c16-3a6f-4dd2-9973-028705762b2c",
    "isFree": false,
    "permissions": [
      "WIX_DEVELOPERS.CREATE_CHECKOUT",
      "WIX_DEVELOPERS.MANAGE_APP_INSTANCE",
      "WIX_DEVELOPERS.MANAGE_CHARGE"
    ]
  },
  "site": {
    "locale": "he",
    "multilingual": {
      "isMultiLingual": false,
      "supportedLanguages": []
    },
    "paymentCurrency": "ILS",
    "siteDisplayName": "Mysite 34",
    "url": "https://doereg11.wixsite.com/mysite-34",
    "description": "My awesome site is all about selling stuff",
    "ownerEmail": "site-owner@test.com",
    "ownerInfo": {
      "email": "site-owner@test.com",
      "emailStatus": "VERIFIED_OPT_IN"
    },
    "siteId": "64fc2d7e-1585-45ef-b1c3-6081185108c1"
  }
}

Identify the App Instance in Frontend Environments
When your app is installed on multiple Wix sites, you need a way to determine which site is making a request. This is done using the app instance.

In some cases, you may only need the instanceId to query your database and perform business logic. In other cases, you may want to fetch additional data about the app instance from Wix. This article covers both approaches across different frontend environments.

To identify the app instance in frontend environments:

Send a Wix access token to a secure backend API.
Decode the token in the backend to retrieve the instanceId and apply the necessary business logic.
Note: The method for sending the access token depends on whether your frontend is Wix-hosted or self-hosted, as Wix-hosted extensions automatically handle authentication.

This article focuses on how to send an access token to your backend. To learn how to decode it, see Identify the App Instance in Backend Environments.

Warning: Don't trust an instanceId sent to your backend as plain text, as it can be manipulated by an attacker.

Wix-hosted frontend
Wix-hosted frontend extensions include those built with the CLI or Blocks.

CLI
Frontend extensions built with the CLI can identify the app instance using a CLI web method extension or CLI API extension. Learn more about differences between web methods and API extensions.

Web method
To identify the app instance using a web method:

Implement a web method to decode a Wix access token, based on the web method backend example.
Import the web method in your frontend code. For example:
Copy
import { getInstance } from "src/backend/get-instance.web.ts";
Call the web method. For example:
Copy
getInstance().then((result) => console.log(result));
API extension
To identify the app instance using an API extension:

Implement an API extension to decode a Wix access token, based on the API extension backend example.

Install Essentials.

Import httpClient.

Copy
import { httpClient } from "@wix/essentials";
Call your API from your frontend code using fetchWithAuth().

Copy
const response = await httpClient.fetchWithAuth(
  `${import.meta.env.BASE_API_URL}/<YOUR_BACKEND_API_NAME>`,
);
Blocks
Frontend extensions built with Blocks can identify the app instance using a Blocks backend function or a self-hosted backend.

Blocks backend function
To identify the app instance using a Blocks backend function:

Create a backend code file.
Implement a function in your backend file to decode a Wix access token, based on the Blocks backend example.
Call your backend from your widget code. For example:
Copy
// The import varies based on the name of your file and function.
import { getInstance } from "backend/instance";

$w.onReady(function () {
  getInstance()
    .then((response) => {
      console.log("Response from my Get Instance function", response);
    })
    .catch((error) => {
      console.log(error);
    });
});
Alternatively, you can use the getDecodedAppInstance() Velo API.

Self-hosted backend
To identify the app instance using a self-hosted backend:

Implement a backend API to decode an access token and identify the app instance, based on one of the following examples:

Self-hosted backend using the REST API
Self-hosted backend using the JavaScript SDK
Install Essentials.

Import httpClient.

Copy
import { httpClient } from "@wix/essentials";
In your Blocks frontend code, send a Wix access token to your backend by calling fetchWithAuth().

Copy
const response = await httpClient.fetchWithAuth(`<YOUR_BACKEND_API>`);
Self-hosted frontend
For self-hosted site extensions, the method of sending an access token to your backend varies depending on the technology:

Custom element
Embedded script
iframe
Important: The backend is responsible for decoding the token and identifying the app instance. For more information, see Identify the App Instance in Backend Environments.

Custom element
To identify the app instance from a self-hosted custom element:

Implement a backend API to decode an access token and identify the app instance, based on one of the following examples:
Self-hosted backend using the REST API
Self-hosted backend using the JavaScript SDK
In your frontend:
Create a Wix client with site host and authentication.
Inject the custom element with a Wix access token.
Send a Wix access token to your backend by calling fetchWithAuth().
The following example demonstrates only the frontend logic.

Copy
import { site } from "@wix/site";
import { createClient } from "@wix/sdk";

// Create a Wix client with site authentication and site host
const myWixClient = createClient({
  auth: site.auth(),
  host: site.host({ applicationId: "<YOUR_APP_ID>" }),
});

class MyCustomElement extends HTMLElement {
  constructor() {
    super();
    // Inject the Wix access token to your custom element
    this.accessTokenListener = myWixClient.auth.getAccessTokenInjector();
  }

  connectedCallback() {
    this.innerHTML = "<p>My custom element loaded successfully!</p>";
    this.callMyBackend();
  }

  async callMyBackend() {
    try {
      // Send a Wix access token to your backend
      const response = await myWixClient.fetchWithAuth("<YOUR_BACKEND_API_URL");
      const data = await response.json();
      console.log("Response from get-instance:", data);
    } catch (error) {
      console.error("Error calling get-instance:", error);
    }
  }
}

customElements.define("<YOUR_CUSTOM_ELEMENT_TAG_NAME>", MyCustomElement);
Embedded script
To identify the app instance from a self-hosted embedded script:

Implement a backend API to decode an access token and identify the app instance, based on one of the following examples:
Self-hosted backend using the REST API
Self-hosted backend using the JavaScript SDK
In your frontend:
Create a Wix client with site host and authentication.
Inject the embedded script with a Wix access token.
Send a Wix access token to your backend by calling fetchWithAuth().
The following examples demonstrate only the frontend logic.

ECMAScript Module

Copy
<script accesstoken="true" type="module">
  import { site } from "@wix/site";
  import { createClient } from "@wix/sdk";
  import { seo } from "@wix/site-seo";

  // Create a Wix client with site authentication and site host
  const myWixClient = createClient({
    auth: site.auth(),
    host: site.host({ applicationId: "<YOUR_APP_ID>" }),
  });

  // Inject the Wix access token to your embedded script
  export const injectAccessTokenFunction =
    myWixClient.auth.getAccessTokenInjector();

  const callMyBackend = async () => {
    // Send a Wix access token to your backend
    const response = await myWixClient.fetchWithAuth("<YOUR_BACKEND_API_URL>");
    console.log("Response from my backend:", response.data);
  };

  callMyBackend();
</script>
Standard

Copy
<script type="text/javascript" src="./my-file.js"></script>;

// my-file.js
import { site } from "@wix/site";
import { createClient } from "@wix/sdk";
import { seo } from "@wix/site-seo";

// Create a Wix client with site authentication and site host
const myWixClient = createClient({
  auth: site.auth(),
  host: site.host({ applicationId: "<YOUR_APP_ID>" }),
});

const callMyBackend = async () => {
  // Send a Wix access token to your backend
  const response = await myWixClient.fetchWithAuth("<YOUR_BACKEND_API_URL>");
  console.log("Response from my backend:", response.data);
};

callMyBackend();
iframe
Wix provides iframes with an encoded instance query parameter. This is relevant for self-hosted dashboard pages, dashboard plugins, settings panels, and external links.

To identify the app instance from an iframe:

Retrieve the instance query parameter from the URL.
Pass the instance value as the token to Token Info.
(Optional) Use the returned instanceId to create an app access token and call Get App Instance.
Copy
const express = require("express");
const axios = require("axios");

const app = express();

app.get("/dashboard", async (req, res) => {
  const instance = req.query.instance;
  if (!instance) return res.status(400).send("Missing instance parameter");

  try {
    // Fetch token info from Wix API
    const tokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: instance,
      },
    );

    const instanceId = tokenResponse.data.instanceId;
    console.log(`App instance ID: ${instanceId}`);

    // (Optional) Fetch additional app instance data from Wix
    const createTokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token",
      {
        grant_type: "client_credentials",
        client_id: "<YOUR_APP_ID>",
        client_secret: "<YOUR_APP_SECRET>",
        instanceId: instanceId,
      },
    );


Identify the App Instance in Backend Environments
When your app is installed on multiple Wix sites, you need a way to determine which site is making a request. This is done using the app instance.

In some cases, you may only need the instanceId to query your database and perform business logic. In other cases, you may want to fetch additional data about the app instance from Wix. This article covers both approaches across different backend environments.

CLI web method extension
For web methods, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because web methods are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to retrieve instance data.

Copy
import { webMethod, Permissions } from "@wix/web-methods";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export const getInstance = webMethod(Permissions.Anyone, async () => {
  const { instanceId } = await auth.getTokenInfo();
  console.log(`App instance ID: ${instanceId}`);
  // (Optional) Fetch app instance data from Wix
  const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
  const { instance, site } = await elevatedGetAppInstance();
  console.log("Response from Get App Instance:", { instance, site });
});
CLI API extension
For CLI API extensions, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
Important: For this to work, you must send a Wix access token from the frontend to your API extension. This can be done with httpClient.fetchWithAuth(), as explained in the Wix-hosted frontend example.

The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because web methods are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to instance data.

Copy
import { webMethod, Permissions } from "@wix/web-methods";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export async function GET(req) {
  try {
    const { instanceId } = await auth.getTokenInfo();
    console.log(`App instance ID: ${instanceId}`);
    // (Optional) Fetch app instance data from Wix
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const { instance, site } = await elevatedGetAppInstance();
    console.log("Response from Get App Instance:", { instance, site });
  } catch {
    return new Response(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
Blocks backend function
For Blocks backend functions, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
Then, you can call your Blocks backend function from your Blocks frontend code.

The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because Blocks backend functions are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to instance data.

Copy
// Backend: instance.jsw
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export async function getInstance() {
  try {
    const { instanceId } = await auth.getTokenInfo();
    console.log(`App instance ID: ${instanceId}`);
    // (Optional) Fetch app instance data from Wix
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const response = await elevatedGetAppInstance();
    console.log("Response from Get App Instance:", response);
    return response;
  } catch {
    return new Response(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
Note: If you're not able to use Essentials, you can extract the Wix access token from the authorization header and send it to Get Token Info.

Self-hosted backend using the JavaScript SDK
For a self-hosted backend using the SDK, you can:

Get instanceId by passing a Wix access token to Token Info.
Fetch instance data by elevating the access token and using it to call getAppInstance().
The following example creates a Node.js Express API called get-instance-data. The API receives an access token from the frontend (which has a visitor or member identity), decodes the token and logs the instanceId, and then creates a client with elevated permissions to fetch the app instance data.

Copy
import express from "express";
import cors from "cors";
import { createClient, AppStrategy } from "@wix/sdk";
import { appInstances } from "@wix/app-management";

const app = express();
const port = 5000;

app.use(cors());

app.get("/get-instance-data", async (req, res) => {
  try {
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    const tokenData = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenData.data.instanceId;
    console.log(`App instance ID: ${instanceId}`);

    const elevatedClient = createClient({
      auth: await AppStrategy({
        appId: "<YOUR_APP_ID>",
        appSecret: "<YOUR_APP_SECRET>",
        accessToken: accessToken,
      }).elevated(),
      modules: {
        appInstances,
      },
    });

    const instanceResponse = await elevatedClient.appInstances.getAppInstance();
    console.log("Response from Get App Instance:", instanceResponse.data);

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Self-hosted backend using the REST API
For a self-hosted backend using the REST API, you can:

Get instanceId by passing a Wix access token to Token Info.
Fetch instance data by elevating the access token and using it to call Get App Instance.
The following example creates a Node.js Express API called get-instance-data. The API receives an access token from the frontend (which has a visitor or member identity), decodes the token and logs the instanceId, and then uses the instanceId to create an access token with app permissions to fetch the instance data.

Copy
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors());

// Define a backend API
app.get("/get-instance-data", async (req, res) => {
  try {
    // Get the Wix access token from the `authorization` header
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    // Extract the app instance ID from the access token
    const tokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenResponse.data.instanceId;
    console.log(`App instance ID: ${instanceId}`);

    // Create a new access token with an app identity
    const newTokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token",
      {
        grant_type: "client_credentials",
        client_id: "<YOUR_APP_ID>",
        client_secret: "<YOUR_APP_SECRET>",
        instanceId: instanceId,
      },
    );
    const elevatedAccessToken = newTokenResponse.data.access_token;

    // Use the new token to get instance data
    const instanceResponse = await axios.get(
      "https://www.wixapis.com/apps/v1/instance",
      {
        headers: {
          Authorization: `Bearer ${elevatedAccessToken}`,
        },
      },
    );
    console.log("Response from Get App Instance:", instanceResponse.data);

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Service plugin extension
For service plugins, get instanceId from the metadata of the service plugin call.

The following example is based on the additional fees service plugin.

Copy
import { additionalFees } from "@wix/ecom/service-plugins";

additionalFees.provideHandlers({
  calculateAdditionalFees: async ({ request, metadata }) => {
    console.log(`App instance ID: ${metadata.instanceId}`);
    return {
      additionalFees: [],
    };
  },
});
CLI event extension
For CLI event extensions, get instanceId from the metadata of the event.

The following example is based on onPostCreated().

Copy
import { posts } from "@wix/blog";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

posts.onPostCreated(async (event) => {
  console.log(`App instance ID: ${event.metadata.instanceId}`);
  // (Optional) Fetch app instance data from Wix
  const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
  const { instance, site } = await elevatedGetAppInstance();
  console.log("Response from Get App Instance:", { instance, site });
});

Identify the App Instance in Backend Environments
When your app is installed on multiple Wix sites, you need a way to determine which site is making a request. This is done using the app instance.

In some cases, you may only need the instanceId to query your database and perform business logic. In other cases, you may want to fetch additional data about the app instance from Wix. This article covers both approaches across different backend environments.

CLI web method extension
For web methods, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because web methods are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to retrieve instance data.

Copy
import { webMethod, Permissions } from "@wix/web-methods";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export const getInstance = webMethod(Permissions.Anyone, async () => {
  const { instanceId } = await auth.getTokenInfo();
  console.log(`App instance ID: ${instanceId}`);
  // (Optional) Fetch app instance data from Wix
  const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
  const { instance, site } = await elevatedGetAppInstance();
  console.log("Response from Get App Instance:", { instance, site });
});
CLI API extension
For CLI API extensions, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
Important: For this to work, you must send a Wix access token from the frontend to your API extension. This can be done with httpClient.fetchWithAuth(), as explained in the Wix-hosted frontend example.

The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because web methods are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to instance data.

Copy
import { webMethod, Permissions } from "@wix/web-methods";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export async function GET(req) {
  try {
    const { instanceId } = await auth.getTokenInfo();
    console.log(`App instance ID: ${instanceId}`);
    // (Optional) Fetch app instance data from Wix
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const { instance, site } = await elevatedGetAppInstance();
    console.log("Response from Get App Instance:", { instance, site });
  } catch {
    return new Response(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
Blocks backend function
For Blocks backend functions, you can:

Get instanceId by calling auth.getTokenInfo().
Fetch instance data by passing getAppInstance to auth.elevate() and calling the elevated function.
Then, you can call your Blocks backend function from your Blocks frontend code.

The following example logs the instanceId, and then elevates the access token to make a request to getAppInstance(). Elevation is necessary because Blocks backend functions are called from frontend code, and frontend access tokens are associated with site visitors or members, who lack permission to instance data.

Copy
// Backend: instance.jsw
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

export async function getInstance() {
  try {
    const { instanceId } = await auth.getTokenInfo();
    console.log(`App instance ID: ${instanceId}`);
    // (Optional) Fetch app instance data from Wix
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const response = await elevatedGetAppInstance();
    console.log("Response from Get App Instance:", response);
    return response;
  } catch {
    return new Response(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
Note: If you're not able to use Essentials, you can extract the Wix access token from the authorization header and send it to Get Token Info.

Self-hosted backend using the JavaScript SDK
For a self-hosted backend using the SDK, you can:

Get instanceId by passing a Wix access token to Token Info.
Fetch instance data by elevating the access token and using it to call getAppInstance().
The following example creates a Node.js Express API called get-instance-data. The API receives an access token from the frontend (which has a visitor or member identity), decodes the token and logs the instanceId, and then creates a client with elevated permissions to fetch the app instance data.

Copy
import express from "express";
import cors from "cors";
import { createClient, AppStrategy } from "@wix/sdk";
import { appInstances } from "@wix/app-management";

const app = express();
const port = 5000;

app.use(cors());

app.get("/get-instance-data", async (req, res) => {
  try {
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    const tokenData = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenData.data.instanceId;
    console.log(`App instance ID: ${instanceId}`);

    const elevatedClient = createClient({
      auth: await AppStrategy({
        appId: "<YOUR_APP_ID>",
        appSecret: "<YOUR_APP_SECRET>",
        accessToken: accessToken,
      }).elevated(),
      modules: {
        appInstances,
      },
    });

    const instanceResponse = await elevatedClient.appInstances.getAppInstance();
    console.log("Response from Get App Instance:", instanceResponse.data);

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Self-hosted backend using the REST API
For a self-hosted backend using the REST API, you can:

Get instanceId by passing a Wix access token to Token Info.
Fetch instance data by elevating the access token and using it to call Get App Instance.
The following example creates a Node.js Express API called get-instance-data. The API receives an access token from the frontend (which has a visitor or member identity), decodes the token and logs the instanceId, and then uses the instanceId to create an access token with app permissions to fetch the instance data.

Copy
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors());

// Define a backend API
app.get("/get-instance-data", async (req, res) => {
  try {
    // Get the Wix access token from the `authorization` header
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    // Extract the app instance ID from the access token
    const tokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenResponse.data.instanceId;
    console.log(`App instance ID: ${instanceId}`);

    // Create a new access token with an app identity
    const newTokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token",
      {
        grant_type: "client_credentials",
        client_id: "<YOUR_APP_ID>",
        client_secret: "<YOUR_APP_SECRET>",
        instanceId: instanceId,
      },
    );
    const elevatedAccessToken = newTokenResponse.data.access_token;

    // Use the new token to get instance data
    const instanceResponse = await axios.get(
      "https://www.wixapis.com/apps/v1/instance",
      {
        headers: {
          Authorization: `Bearer ${elevatedAccessToken}`,
        },
      },
    );
    console.log("Response from Get App Instance:", instanceResponse.data);

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Service plugin extension
For service plugins, get instanceId from the metadata of the service plugin call.

The following example is based on the additional fees service plugin.

Copy
import { additionalFees } from "@wix/ecom/service-plugins";

additionalFees.provideHandlers({
  calculateAdditionalFees: async ({ request, metadata }) => {
    console.log(`App instance ID: ${metadata.instanceId}`);
    return {
      additionalFees: [],
    };
  },
});
CLI event extension
For CLI event extensions, get instanceId from the metadata of the event.

The following example is based on onPostCreated().

Copy
import { posts } from "@wix/blog";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";

posts.onPostCreated(async (event) => {
  console.log(`App instance ID: ${event.metadata.instanceId}`);
  // (Optional) Fetch app instance data from Wix
  const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
  const { instance, site } = await elevatedGetAppInstance();
  console.log("Response from Get App Instance:", { instance, site });
});



Authenticate Incoming Requests to Your Self-Hosted Backend
Once you expose a self-hosted backend API to make it available for your app, you need to make sure that requests to your API are coming from your app and not from malicious users.

To authenticate requests, use your app's unique app instance object, which is signed with your app's secret key.

App instance object
An app instance object is a JSON object that contains information about the site an app is installed on, the current user, and the current instance of your app. Wix encrypts this object and passes it in string format to your app's iframe as a query parameter.

The app instance object contains the following useful fields:

instanceId: ID of the current instance of your app.
uid: ID of the user who is logged into the site your app is installed on.
To learn more about the app instance object and its fields, see About App Instances.

Step 1 | Get the app instance
In your app’s frontend code, you need to retrieve the app instance string so you can send it along with your requests to the backend.

To retrieve the app instance string, use the following helper function in your code:

Copy
export function getAppInstance() {
  return new URLSearchParams(window.location.search).get("instance")!;
}
Step 2 | Send the app instance
Once you've retrieved the app instance, you need to send it in requests you make to your backend. Your backend should use the app instance to authenticate requests and extract any information needed from the app instance.

To make HTTP requests to your backend with the signed instance, use something similar to the following (typescript) helper function:

Copy
export async function fetchWithWixInstance(url: string, options: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: getAppInstance(),
      ...options.headers,
    },
  });
}
This function sends the app instance string in the authorization header when making requests to the backend.

Step 3 | Validate the app instance
When a request is made to your app’s backend, you should authenticate it before continuing to process it. To do this, you need your app's secret key. You can get your app's secret key from the OAuth page in your app's dashboard.

Important: Store your app secret securely on your server!

The app instance string has 2 parts — signature and data. To authenticate a request, extract the signature from the app instance string sent in the request and verify it was signed with your app's secret key.

For parsing examples in a number of programming languages, see Parse the Encoded App Instance Parameter.

Here is an example of how to parse the instance in TypeScript:

Copy
import { createHmac } from "crypto";

export function parseInstance(
  instance: string,
  appSecret: string,
): {
  instanceId: string;
  appDefId: string;
  signDate: string;
  uid: string;
  permissions: "OWNER";
  demoMode: boolean;
  siteOwnerId: string;
  siteMemberId: string;
  expirationDate: string;
  loginAccountId: string;
  pai: null;
  lpai: null;
} | null {
  var parts = instance.split("."),
    hash = parts[0],
    payload = parts[1];

  if (!payload) {
    return null;
  }

  if (!validateInstance(hash, payload, appSecret)) {
    return null;
  }

  return JSON.parse(base64Decode(payload, "utf8"));



  Add Self-hosted Dashboard Page Extensions
The dashboard page extension adds an iframe page to a site dashboard. Add a self-hosted dashboard page in your app's dashboard.

Note: For a more streamlined approach to developing your dashboard page, try out the Wix CLI or Blocks instead of self-hosting.

Add a dashboard page
Build your extension using the technologies of your choice. Make sure your iframe extension:
Is hosted on a publicly accessible server.
Is served on an https URL, not an http one. For security reasons, the app dashboard does not support making requests to non-https servers.
Select an app from the Custom Apps page in your Wix Studio workspace.
Go to Extensions and click + Create Extension.
In the Choose the extension you want to create modal, select Dashboard Page and click Create.
On the Dashboard Page extension configuration page, fill in the following fields:
Field	Description
General > Name	Required. An internal name used in the app dashboard to manage this page.
General > Extension ID	A unique Wix-generated ID used to identify this extension. Use this identifier with the Dashboard SDK to trigger navigation between your app’s pages.
Page Info > iFrame URL	Required. Your app server’s address. Content hosted there is rendered in the iFrame on the dashboard.

The app instance data is appended to the iFrame URL as an encoded query parameter, instance, so that you can identify the site owner when they view your page.

Note: For security reasons, your app must be hosted on an https address.
Page info > Relative route	Required. A path suffix to append to the URL when users visit your page in the dashboard. For example, https://manage.wix.com/dashboard/<site_identifier_guid>/app/<app_identifier_guid>/<relative_route_used>.
Page info > Hide the sidebar menu when your page is open	Whether to hide the sidebar menu when your dashboard page is viewed.
Sidebar configuration > Page name	Required. A name for the dashboard page that appears in the sidebar menu.
Dashboard Page Configuration Page

Click Save to save your changes.
Manage and customize your dashboard page
Now that your dashboard page is set up you can manage and customize your dashboard page.

Manage your dashboard page with the dashboard SDK.

Access data from the dashboard page using the observeState() SDK function in your dashboard page extension:

Copy
client.dashboard.observeState((componentParams) => {
  console.log(componentParams.customPageParameter);
});
Note: If you use a menu plugin extension to navigate to your dashboard page, data from the page hosting the menu plugin, such as an ID, is passed through the menu plugin slot to your dashboard page extension.

Design your dashboard page's UI. Consider using the Wix Design System, a collection of reusable React components that you can use to make your app appear and feel like a native Wix app.

Link directly into your app
If you want to notify a user about something that happened in your app or an action they must take, you can direct them to your app instance installed on a specific Wix site. Use the following URL: https://www.wix.com/my-account/app/<appID>/<appInstanceID>.

You can get the app instance ID by parsing it from the app instance query parameter in the iFrame URL, or by calling the Get App Instance endpoint.

Organize multiple dashboard pages
Your app can include multiple dashboard pages, for example, an overview page and a settings page. Multiple dashboard pages are bundled in the sidebar menu under your app’s name. When a user clicks or hovers over it, a submenu appears with all your dashboard pages.

To manage multiple dashboard pages:

Go to Extensions in your app's dashboard.

In the top-level menu item, click the ellipsis icon and click Change page order.

Changing page order

In the Manage Dashboard pages modal, rearrange the pages as you’d like them to appear in the side menu of the user’s dashboard.

Manage multiple dashboard pages

The top-level menu item displays your app’s name, with dashboard page extensions listed as sub-items. Each extension is named based on the value specified in the Page name field on its configuration page.

You can rename any of these menu items by hovering over them and clicking the pencil icon.

Click Save.


Step 5 | Implement a Self-hosted Catalog Service Plugin
< Previous | Next >

In Step 2, we created a catalog database to store the poems a Wix user sells on their site. In order to connect that catalog to the eCommerce platform, we need to create a server to implement the Catalog service plugin.

The service plugin includes a single method called Get Catalog Items. Wix calls this method when a cart or checkout on the Wix user’s site is updated. In the call, it includes the IDs of any items in the cart, and in return it expects information from the catalog about each item.

Wix doesn’t know where the catalog database is located–it only knows the location of the service plugin endpoint. Therefore, the service plugin must retrieve the items from the catalog database and return them to Wix in the correct format. In our case, this means our service plugin needs to communicate with the Wix site to access the catalog database and return the required item details.

In this example app, we’ve placed the catalog database on a Wix site. But remember that in your own business solution, you can choose to locate the catalog database anywhere, including on your server or in an external database. You just need to change your server logic to fetch from that location.

There are several things our server code must do to fulfill a Get Catalog Items request:

Verify and decode the incoming request sent as a JSON web token.
Extract the app instance ID and requested item IDs from the decoded payload.
Create a client to communicate with the Wix site that sent the request.
Use the client to request information from the site catalog database about each item.
Return all item information in a form that matches the Get Catalog Items response object.
We’ll write our server code in Express, so the first thing we need to do is set up Express and other necessary packages.

Install the following npm packages from Wix:

Copy
npm install @wix/sdk
npm install @wix/data
Install Express and set up an app. Use version 4.17.0. You can choose to use express-generator, but it isn’t necessary for this example.

Once your Express app is created, open the app.js file and paste the following code:

Copy
const express = require("express");
const jose = require("jose");
const { createClient, AppStrategy } = require("@wix/sdk");
const { collections, items } = require("@wix/data");
const app = express();
const port = 3000;

app.use(express.text());

async function verify(jwt) {}

app.post("/get-catalog-items", async (request, response) => {});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
Most of the above code is standard Express. However, we’ve added some extra lines that are specific to our business solution:

Lines 2-4. Import 3 libraries that we’ll need in our server code:

Jose for JWT verification.
Wix SDK to create a Wix client.
Wix Data to work with collection data on a site.
Line 8. Set up the express.text() middleware function. This function parses the incoming request, including the encoded body, into a string that our verification function can handle.

Line 10. Create our verify() function, which will accept a JWT token as a string and decode it. We’ll write the code for this in a moment.

Line 12. A POST method that receives Get Catalog Items requests from Wix and returns the correct information from the catalog. We’ll write the code for this shortly.

Let’s start by writing the code for the verify() function.

Verify the JWT token
As with all service plugins at Wix, when a Wix site calls Get Catalog Items, it encodes the request body as a JWT. Therefore, in the service plugin we must decode the token in order to extract information like the app instance and catalog IDs. In this tutorial, we use the jose library for JWT verification.

In the verify() function we created before, add a try-catch block. Above the try block, add 2 const variables alg and spki.

The first variable defines the RSA algorithm we’re using. In the case of requests from Wix, this is RS256, so we’ll assign the variable this value as a string:

Copy
const alg = "RS256";
The second variable, spki, is our public key. Each app in the Custom Apps list has a unique public key. To find this key, return to the App ID & keys modal in the app dashboard. Copy the public key from the modal.

Copy the public key from the App ID & keys modal in your app dashboard

Paste the public key as the value for spki.

Let’s start adding code to the try block. We first add some error checking code that ensures the jwt parameter is a string:

Copy
try {
  if (typeof jwt !== "string") {
    throw new Error("JWT must be a string");
  }
} catch (error) {}
Next, we add the functions that actually do the decoding. The first function we add is importSPKI():

Copy
const publicKey = await jose.importSPKI(spki, alg);
We pass the spki and alg variables to importSPKI() and store the result in a new variable called publicKey. We then pass this result to the jwtVerify() function, along with the jwt parameter and an JWTVerifyOptions object:

Copy
const { payload, protectedHeader } = await jose.jwtVerify(jwt, publicKey, {
  issuer: "wix.com",
  audience: "<YOUR APP ID>",
  maxTokenAge: 60,
  clockTolerance: 60,
});
Set the attributes in the options parameter as shown. These options allow us to validate requests received from Wix. To set the audience value, copy your app ID from the app dashboard.

Finally, we return the payload.

Copy
return payload;
Now we’ll add code to the catch block. You can add more complex error handling later, but for now we’ll simply throw an error with a message that the verification failed.

Copy
catch (error) {
    throw new Error('JWT verification failed');
  }
The full code for the function should now look like this:

Copy
async function verify(jwt) {
  const alg = "RS256";
  const spki = `<YOUR PUBLIC KEY>`;

  try {
    if (typeof jwt !== "string") {
      throw new Error("JWT must be a string");
    }

    const publicKey = await jose.importSPKI(spki, alg);
    const { payload, protectedHeader } = await jose.jwtVerify(jwt, publicKey, {
      issuer: "wix.com",
      audience: "<YOUR APP ID>",
      maxTokenAge: 60,
      clockTolerance: 60,
    });

    return payload;
  } catch (error) {
    throw new Error("JWT verification failed");
  }
}
Implement Get Catalog Items
Now that we’ve set up our verify() function, we can implement the Get Catalog Items endpoint, so that Wix can make calls to our server to get information about catalog products.

Go to the POST method we created below the verify() function:

Copy
app.post("/get-catalog-items", async (reqest, response) => {});
Note a couple of important things here:

The path we route catalog requests to must be in snakecase. Make sure your  path is identical to the one shown above.

We will need to make asynchronous calls inside our handler function, so mark it as async.

Inside the handler function add a try-catch block. In the try block add the following lines of code:

Copy
const token = request.body;
const body = await verify(token);
const instanceId = body.data.metadata.instanceId;
const requestedItems = body.data.request.catalogReferences;
Let’s break down what this code is doing:

Line 1. Isolate the request body, which is in JWT format, and store it in a variable token.

Line 2. Pass the token to verify(). If the token is valid, verify() returns the request body as a decoded object, which we store in a JS object called body.

Lines 3-4. Parse body to extract 2 important pieces of information:

The instance ID. This tells us which instance of our app made the request. We’ll use this shortly to query the site catalog.

The list of items that the Wix site is requesting information about. This tells us which items to retrieve information about from the catalog.

Because our server is self-hosted, we need to create a client in order to make calls to a Wix site. We use the Wix SDK createClient() function to do this.

createClient() expects a configuration object with at least 2 attributes:

modules: The Wix SDK modules your self-hosted app uses. This typically matches the modules that you imported.

Your app’s authentication strategy. In our example the app will make API calls, so we use the AppStrategy authentication strategy.

Add the following code to the try block:

Copy
const wixClient = createClient({
  modules: { items },
  auth: AppStrategy({
    appId: "<YOUR APP ID>",
    appSecret: "<YOUR APP SECRET KEY>",
    publicKey: `<YOUR PUBLIC KEY>`
    instanceId: instanceId,
  }),
});
Line 2. Define the modules we use in this client. In this case, we only use the items module.

Lines 3-8. Define the AppStrategy object. This object requires your app ID, app secret, and public key from the app dashboard.

The AppStrategy object also requires the ID of the app instance. This tells the app which site it’s communicating with. We take the ID we parsed from the decoded request body and pass it to the AppStrategy constructor.

This sets up our client and prepares us to make calls to the site collection.

Before adding the next piece of code, we need the ID of the Poems collection we created in Step 2. Return to the Blocks app and go to your collection in the CMS. Click Edit Settings to open the collection settings.

Go to CMS settings in Blocks to get your collection ID

Beneath the collection name, copy the collection ID.

Return to the Express code. Beneath the createClient() method we added, add this code:

Copy
const catalogItems = await Promise.all(
  requestedItems.map(async (reference) => {
    const results = await wixClient.items
      .query("<COLLECTION ID>")
      .eq("mainProductId", reference.catalogReference.catalogItemId)
      .find();
    const item = results.items[0];
    const options =
      reference.catalogReference.options !== null
        ? reference.catalogReference.options
        : {};

    return {
      catalogReference: {
        appId: "<YOUR APP ID>",
        catalogItemId: item.mainProductId,
        options: options,
      },
      data: {
        productName: {
          original: item.title,
        },
        itemType: {
          preset: "SERVICE",
        },
        price: item.price,
        priceDescription: {
          original: "Number of lines",
        },
      },
    };
  }),
);

response.send({ catalogItems });
Before we review this code line by line, it’s important to understand its overall purpose. The code takes in the requestedItems array we created containing catalog references for the requested items, and returns a new array of catalog items in the required format. To do so, it performs the following steps:

Extracts the catalog ID of each item in the requestedItems array.
Queries the site catalog for that ID.
Organizes the returned information from the site into an object that matches the Get Catalog Items response.
Let’s break down the code line by line:

Line 1. Wrap the Javascript map() function in a Promise.all() statement that returns the array of objects only after the query has been resolved for all items.

Lines 3-6. Using the Wix client we created, query the catalog database on the site. Paste your collection ID as the parameter.

Line 7. Store the query result.

Line 8. Extract the variant information from the requested item and place it in an object options that can be passed to the returned item.

Lines 10-28. Set up the response object in the correct format.

Line 31. Returns the complete array of catalog references catalogItems to the caller.

To complete the Get Catalog Items endpoint, we’ll fill out the catch block. As with verify(), you can add more complex error handling later, but for now we’ll just return a 400 status with an error message:

Copy
catch (error) {
    response.status(400).send({ error: error.message });
  }
Our server code is complete, but we need to complete one extra step to make sure it can communicate with the product catalog on the site.

In our code, we call the query() method of the Wix Data items module. Like all API methods at Wix, in order for our app to call this method, it must have the correct permissions. We can locate these permissions in the reference above the method declaration:

Location of API method permissions

The specific permission we need to call query() is READ DATA ITEMS. To add this permission to our app, return to the app dashboard and go to permissions. Click + Add Permissions.

The easiest way to locate the permission you need to add is to search by name or ID. Search for “read data items”. Select the correct permission and click Save to add it to your app.

Add read data items permissions to your app

The permission should now appear in the permissions list:

Permissions list app dashboard

Now our app can communicate with the product catalog on a site.

Our service plugin code is now complete. Here’s the full code for app.js:

Copy
const express = require("express");
const jose = require("jose");
const { createClient, AppStrategy } = require("@wix/sdk");
const { collections, items } = require("@wix/data");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.text());

async function verify(jwt) {
  const alg = "RS256";
  const spki = `<YOUR PUBLIC KEY>`;

  try {
    if (typeof jwt !== "string") {
      throw new Error("JWT must be a string");
    }

    const publicKey = await jose.importSPKI(spki, alg);
    const { payload, protectedHeader } = await jose.jwtVerify(jwt, publicKey, {
      issuer: "wix.com",
      audience: "<YOUR APP ID>",
      maxTokenAge: 60,
      clockTolerance: 60,
    });

    return payload;
  } catch (error) {
    throw new Error("JWT verification failed");
  }
}

app.post("/get-catalog-items", async (request, response) => {
  try {
    const token = request.body;
    const body = await verify(token);
    const instanceId = body.data.metadata.instanceId;
    const requestedItems = body.data.request.catalogReferences;

    const wixClient = createClient({
      modules: { collections, items },
      auth: AppStrategy({
        appId: "<YOUR APP ID>",
        appSecret: "<YOUR APP SECRET KEY>",
        publicKey: `<YOUR PUBLIC KEY>`,
        instanceId: instanceId,
      }),
    });

    const catalogItems = await Promise.all(
      requestedItems.map(async (reference) => {
        const results = await wixClient.items
          .query("<COLLECTION ID>")
          .eq("mainProductId", reference.catalogReference.catalogItemId)
          .find();
        const item = results.items[0];
        const options =
          reference.catalogReference.options !== null
            ? reference.catalogReference.options
            : {};

        return {
          catalogReference: {
            appId: "<YOUR APP ID>",
            catalogItemId: item.mainProductId,
            options: options,
          },
          data: {
            productName: {
              original: item.title,
            },
            itemType: {
              preset: "SERVICE",
            },
            price: item.price,
            priceDescription: {
              original: "Number of lines",
            },
          },
        };
      }),
    );

    response.send({ catalogItems });
  } catch (error) {
    response.status(400).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
Deploy your code on your chosen server.

Create an Ecom Catalog in the App Dashboard
Once we deploy our server code, we need to tell Wix where to send its requests. To do this, we’ll return to our app dashboard and create an Ecom Catalog extension:

In the app dashboard, go to the extensions page.

Click + Create Extension and search for Ecom Catalog. Click + Create.

In the JSON editor, add a key deploymentUri. As its value, paste the deployment URI of your server. For example:

Copy
{
  "deploymentUri": "https://the-poems-manager.com"
}
Click Save. The Ecom Catalog extension now appears on our app’s extension list:

Extensions list app dashboard

Our app is now complete and able to function on a site. In the last article, we'll build the app, install it on a site, and test the functionality we created throughout this tutorial.

Identify the App Instance in a Self-Hosted Site Widget
For security reasons, app instance ID (instanceId) isn’t directly accessible in site widgets or settings panels. Instead, you can securely extract it by sending a Wix access token to a backend API. The backend can decode the token, get the instance ID or instance data, and perform any necessary business logic.

This article explains how to:

Backend: Expose a backend API to identify the app instance.
Frontend: Pass a Wix access token from your custom element to your backend.
Step 1 | Expose a backend API
To securely identify the app instance:

Expose a backend API. You can build and deploy your backend API using any framework. The examples in this article are based on a Node.js server.

In your backend API code, get the Wix access token from the authorization header.

Copy
const accessToken = req.headers["authorization"];
Depending on your use case, you may only need instanceId or you may need more detailed app instance data.

To extract instanceId:

Call Get Token Info to extract instanceId from the access token.

Copy
const tokenResponse = await axios.post(
  "https://www.wixapis.com/oauth2/token-info",
  {
    token: accessToken,
  },
);
const instanceId = tokenResponse.data.instanceId;
To fetch instance data:

Elevate the access token to an app identity. Then, call Get App Instance (SDK | REST). Elevation is necessary because access tokens sent from site widgets are tied to a site visitor or member identity, which don't have access to instance data.

The method of performing elevation varies depending on whether you're using the JavaScript SDK or REST API.

JavaScript SDK

Copy
const elevatedClient = createClient({
  auth: await AppStrategy({
    appId: "<YOUR_APP_ID>",
    appSecret: "<YOUR_APP_SECRET>",
    accessToken: accessToken,
  }).elevated(),
  modules: {
    appInstances,
  },
});

const instanceResponse = await elevatedClient.appInstances.getAppInstance();
To learn more, see Elevate SDK Call Permissions with Self-Hosting.

REST API

Copy
// Extract the app instance ID from the access token
const tokenResponse = await axios.post(
  "https://www.wixapis.com/oauth2/token-info",
  {
    token: accessToken,
  },
);
const instanceId = tokenResponse.data.instanceId;

// Create a new access token with an app identity
const newTokenResponse = await axios.post(
  "https://www.wixapis.com/oauth2/token",
  {
    grant_type: "client_credentials",
    client_id: "<YOUR_APP_ID>",
    client_secret: "<YOUR_APP_SECRET>",
    instanceId: instanceId,
  },
);
const elevatedAccessToken = newTokenResponse.data.access_token;

// Use the new token to get instance data
const instanceResponse = await axios.get(
  "https://www.wixapis.com/apps/v1/instance",
  {
    headers: {
      Authorization: `Bearer ${elevatedAccessToken}`,
    },
  },
);
To learn more, see Elevate REST API Call Permissions with Self-Hosting.

Step 2 | Pass a Wix access token to your backend
To pass a Wix access token from your custom element to your backend:

Add a self-hosted site widget extension with a custom element. If you already have a site widget, skip to the next step.

In your custom element code, initialize a WixClient with the site authentication and host configuration.

Copy
const myWixClient = createClient({
  auth: site.auth(),
  host: site.host({ applicationId: "<YOUR_APP_ID>" }),
});
Add the following line to the constructor of your custom element class to inject the Wix access token.

Copy
this.accessTokenListener = myWixClient.auth.getAccessTokenInjector();
Call fetchWithAuth() to send the access token to your backend.

Copy
const response = await myWixClient.fetchWithAuth("<YOUR_API_URL>");
Tip: To get instanceId in the settings panel, initialize a WixClient with the editor authentication and host configuration. Then, call fetchWithAuth().

Examples
Depending on your use case, the logic of your backend API will vary. For example, you may only need to extract instanceId and then use it to make a request to your own database. Alternatively, you may wish to request app instance data from Wix, in which case you'd need to elevate your access token.

See the relevant example for your use case:

Backend: Extract instanceId
Backend: Fetch instance data with the JavaScript SDK
Backend: Fetch instance data with the REST API
Frontend: Call your backend
Backend: Extract instanceId
The following example creates a Node.js Express API called get-instance. The API extracts instanceId from the access token provided by the frontend request.

Copy
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors());

// Edit this code based on your business logic
const mockDatabaseQuery = async (instanceId) => {
  console.log(`Mock database query with instance ID: ${instanceId}`);
  if (instanceId) {
    return {
      status: "Success",
    };
  } else {
    return {
      status: "No instance ID.",
    };
  }
};

// Define a backend API
app.get("/get-instance", async (req, res) => {
  try {
    // Get the Wix access token from the `authorization` header
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    // Extract the app instance ID from the access token
    const tokenData = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenData.data.instanceId;
    console.log("Instance ID:", instanceId);

    // Edit this code based on your business logic
    const data = await mockDatabaseQuery(instanceId);

    return res.json(data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Backend: Fetch instance data with the JavaScript SDK
The following example creates a Node.js Express API called get-instance. The API receives an access token from the frontend, creates a client with elevated permissions, and then uses the elevated client to fetch the app instance data.

Copy
import express from "express";
import cors from "cors";
import { createClient, AppStrategy } from "@wix/sdk";
import { appInstances } from "@wix/app-management";

const app = express();
const port = 5000;

app.use(cors());

// Define a backend API
app.get("/get-instance", async (req, res) => {
  try {
    // Get the Wix access token from the `authorization` header
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    const elevatedClient = createClient({
      auth: await AppStrategy({
        appId: "<YOUR_APP_ID>",
        appSecret: "<YOUR_APP_SECRET>",
        accessToken: accessToken,
      }).elevated(),
      modules: {
        appInstances,
      },
    });

    const instanceResponse = await elevatedClient.appInstances.getAppInstance();

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Backend: Fetch instance data with the REST API
The following example creates a Node.js Express API called get-instance. The API receives an access token from the frontend, uses the token to request a new access token with the permissions of an app, and then uses the new elevated access token to fetch the app instance data.

Copy
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors());

// Define a backend API
app.get("/get-instance", async (req, res) => {
  try {
    // Get the Wix access token from the `authorization` header
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    // Extract the app instance ID from the access token
    const tokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token-info",
      {
        token: accessToken,
      },
    );
    const instanceId = tokenResponse.data.instanceId;

    // Create a new access token with an app identity
    const newTokenResponse = await axios.post(
      "https://www.wixapis.com/oauth2/token",
      {
        grant_type: "client_credentials",
        client_id: "<YOUR_APP_ID>",
        client_secret: "<YOUR_APP_SECRET>",
        instanceId: instanceId,
      },
    );
    const elevatedAccessToken = newTokenResponse.data.access_token;

    // Use the new token to get instance data
    const instanceResponse = await axios.get(
      "https://www.wixapis.com/apps/v1/instance",
      {
        headers: {
          Authorization: `Bearer ${elevatedAccessToken}`,
        },
      },
    );

    return res.json(instanceResponse.data);
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Frontend: Call your backend
The following example creates a custom element that makes a request to the get-instance endpoint.

Copy
import { site } from "@wix/site";
import { createClient } from "@wix/sdk";

// Create a Wix Client with site authentication and site host
const myWixClient = createClient({
  auth: site.auth(),
  host: site.host({ applicationId: "<YOUR_APP_ID>" }),
});

class MyCustomElement extends HTMLElement {
  constructor() {
    super();
    // Inject the Wix access token to your custom element
    this.accessTokenListener = myWixClient.auth.getAccessTokenInjector();
  }

  connectedCallback() {
    this.innerHTML = "<p>My custom element loaded successfully!</p>";
    this.callMyBackend();
  }

  async callMyBackend() {
    try {
      // Send the access token to your backend
      const response = await myWixClient.fetchWithAuth(
        "<YOUR_API_BASE_URL>/get-instance",
      );
      const data = await response.json();
      console.log("Response from get-instance:", data);
    } catch (error) {
      console.error("Error calling get-instance:", error);
    }
  }
}

customElements.define("<YOUR_CUSTOM_ELEMENT_TAG_NAME>", MyCustomElement);


Authenticate using the Wix Client in Self-Hosted Embedded Script Extensions
In a self-hosted embedded script extension, you need to use a Wix Client to call Wix APIs using the SDK.

To call frontend modules, the client must be initialized with the Site host context.
To call backend modules, the client must be authenticated using Site authentication.
Note: We recommend always creating your client using Site host context and authentication so it can be used to call frontend and backend modules.

Script types
Before starting to code, check whether your scripts are standard JavaScript scripts or JavaScript modules (ESM).

Standard JavaScript scripts either have no type specified or specify type="text/javascript" in the script tags.
JavaScript modules specify type="module" in the script tags and they use the import syntax.
Note: Most modern build tools like Vite and esBuild output ESM bundles, so make sure to check your app's configuration.

JavaScript modules (ESM)
In JavaScript modules, you need to export a function that Wix uses to inject your client with an access token to call backend modules.

For the script in which you want to call SDK methods, add accesstoken="true" to your script tag.
Create a client using Site host context and Site authentication.
Export a function exactly like this:
Copy
export const injectAccessTokenFunction =
  myWixClient.auth.getAccessTokenInjector();
Wix calls this function to inject your client with an access token.
Use the client to call SDK methods.
Example
The following example uses an authenticated client to call:

products.queryProducts from the @wix/stores backend module
seo.title from the @wix/site-seo frontend module
Copy
<script accesstoken="true" type="module">
  import { site } from "@wix/site";
  import { createClient } from "@wix/sdk";
  import { products } from '@wix/stores';
  import { seo } from "@wix/site-seo";

  const myWixClient = createClient({
    auth: site.auth(),
    host: site.host({ applicationId: "<your_app_id>" }),
    modules: {
      products,
    }
  });

  export const injectAccessTokenFunction = myWixClient.auth.getAccessTokenInjector();

  myWixClient.products
    .queryProducts()
    .find()
    .then((productsQueryResult) => {
      console.log('Products query result:', productsQueryResult)
    });

  myWixClient.seo.title().then((title) => {
    console.log("Site title:", title);
  });
</script>
Standard JavaScript scripts
In standard JavaScript scripts, you don't need to provide Wix with any injector functions.

Create a JavaScript file to host your code. This file will be your scripts src.
Create a client using Site host context and Site authentication.
Use the client to call SDK methods.
Create your script and add your JavaScript file as the script's src.
Example
The following example uses an authenticated client to call:

products.queryProducts from the @wix/stores backend module
seo.title from the @wix/site-seo frontend module
Copy
<script type="text/javascript" src="./my-file.js"></script>;

// my-file.js
import { site } from "@wix/site";
import { createClient } from "@wix/sdk";
import { products } from "@wix/stores";
import { seo } from "@wix/site-seo";

const myWixClient = createClient({
  auth: site.auth(),
  host: site.host({ applicationId: "<your_app_id>" }),
  modules: {
    products,
  },
});

myWixClient.products
  .queryProducts()
  .find()
  .then((productsQueryResult) => {
    console.log("Products query result:", productsQueryResult);
  });

myWixClient.seo.title().then((title) => {
  console.log("Site title:", title);

Elevate REST API Call Permissions with Self-Hosting
In workflows that use mostly site visitor, site member, or Wix user authentication, you may occasionally need to call APIs that require the elevated level of a Wix app identity for authentication. This can happen when coding in a frontend environment such as a site extension or a dashboard extension.

The process involves two steps:

Setting up your app's backend code to handle requests that require Wix app permissions.
Sending an authenticated call from your frontend code to your app's backend.
Important: Exposed elevated function calls create a security risk for privilege escalation attacks. Make sure to protect your exposed function calls with the appropriate logic.

To elevate permissions for API calls:

Step 1 | Set up your app's backend
The first step is to set up your app's backend to handle requests for API calls from your frontend.

To set up your backend:

Set up an endpoint to receive HTTP requests. In your endpoint's code, extract the authorization header from incoming requests. When you send requests to the endpoint from your frontend code, this header's value will be an access token that includes authentication data for the site visitor or member.

Retrieve the app instanceId from the access token. In your endpoint code, call Wix's Token Info endpoint. The response includes the instanceId.

Copy
curl -X POST ֿ
  'https://www.wixapis.com/oauth2/token-info' 
  --d '{
    "token": "<token>"
  }'
Create an access token with a Wix app identity. In your endpoint code, call Wix's Create Access Token endpoint and include your instanceId in the request body. The response includes an accessToken with a Wix app identity.

Copy
curl -X POST ֿ
  'https://www.wixapis.com/oauth2/token' 
  -H 'Content-Type: application/json'
  --d '{
     "instance_id": "<instanceId>"
     "grant_type": "client_credentials",
     "client_id": "<app_id>",
     "client_secret": "<app_secret_key>",
   }'
In your endpoint code, use the access token to authorize calls to endpoints that require a Wix app identity for authentication.

Step 2 | Send authenticated requests from your frontend
Next, use the Wix JavaScript SDK to send authenticated requests from your site's frontend code to your backend endpoint.

To send requests:

In your app's frontend code, import createClient() from the @wix/sdk package as well as the relevant host module.
Copy
import { createClient } from "@wix/sdk";
// Include one of the following:
import { dashboard } from "@wix/dashboard";
import { editor } from "@wix/editor";
import { site } from "@wix/site";
Create an SDK client using the auth() and host() functions from the appropriate host module.
Copy
const wixClient = createClient({
  auth: < dashboard.auth() | editor.auth() >,
  host: < dashboard.host() | editor.host() | site.host() >
});
Use the client's fetchWithAuth function to make calls to your app's backend endpoint. This function automatically signs API calls with an authorization header that identifies the current site visitor or member.
Copy
const response = await wixClient.fetchWithAuth(
  `https://my-backend.com/apis/func`,
);


Elevate SDK Call Permissions with Self-Hosting
In workflows that use mostly site visitor, site member, or Wix user authentication, you may occasionally need to make calls with elevated permissions. You can use the JavaScript SDK to provide specific calls with Wix app authentication.

The process involves two steps:

Setting up your app's backend code to handle elevated requests.
Sending an authenticated call from your frontend code to your app's backend. Frontend code includes site extension and dashboard extension code.
Important: Exposed elevated function calls create a security risk for privilege escalation attacks. Make sure to protect your exposed function calls with the appropriate logic.

To elevate permissions for API calls:

Step 1 | Set up your app's backend
The first step is to set up your app's backend to handle requests for elevated function calls from your frontend.

To set up your backend:

In your code file, import the following:
createClient and AppStrategy from the Wix SDK module.
The SDK module containing the function that you want to make elevated calls to.
Express
Copy
import { createClient, AppStrategy } from '@wix/sdk';
import { <module> } from '@wix/<package>';
import express from "express";
Note: You can use your preferred method to expose HTTP functions from your self-hosted backend. For this example, we used the express NPM package.

Set up an endpoint. In your endpoint's code, extract the authorization header from incoming requests. When you send requests to the endpoint from your frontend code, this header's value will be an access token that includes authentication data for the site visitor or member.
Copy
const app = express();

app.get("/func", (req, res) => {
  const accessToken = req.headers["Authorization"];
});
In your endpoint code, use createClient() to create a client that can make authenticated SDK calls. Use AppStrategy to construct the auth value for your createClient() call. Chain a call to elevated() to your call to the AppStrategy constructor. Your createClient() call should include your app ID, app secret key, access token, and SDK module. You can find your app ID and app secret key in your app's dashboard.
Copy
const elevatedClient = createClient({
   auth: await AppStrategy({
     appId: "YOUR_APP_ID",
     appSecret: "YOUR_APP_SECRET",
     accessToken: accessToken
   }).elevated(),
   modules: {
     <module>
   }
 });
This call to createClient() returns a client that can make API calls with Wix app authentication. To make calls with site visitor or site member authentication, create a second client without using elevated().
Use the client to make elevated calls to the functions of the SDK module.
Copy
elevatedClient.<module>.<function>()
Step 2 | Send authenticated requests from your frontend
Next, send authenticated requests from your site's frontend code to your backend endpoint.

To send requests:

In your app's frontend code, import createClient() as well as the relevant host module.
Copy
import { createClient } from "@wix/sdk";
// Include one of the following:
import { dashboard } from "@wix/dashboard";
import { editor } from "@wix/editor";
import { site } from "@wix/site";
Create an SDK client using the auth() and host() functions from the appropriate host module.
Copy
const wixClient = createClient({
  auth: < dashboard.auth() | editor.auth() >,
  host: < dashboard.host() | editor.host() | site.host() >
});
Use the client's fetchWithAuth function to make calls to your app's backend endpoint. This function automatically signs API calls with an authorization header that identifies the current site visitor or member.
Copy
const response = await wixClient.fetchWithAuth(
  `https://my-backend.com/apis/func`,
);

Self-hosting considerations
Self-hosting your app gives you the freedom to use the tech stack of your choice, which may be the best fit for your use case. However, there are several factors to consider:

You will need to build and host your app's features independently, integrating them with Wix using the Wix App Dashboard.

You will need to manually initialize and use a Wix client. A Wix client is used to call functionality from the Wix JavaScript SDK and manage the authentication of SDK calls. In Wix-hosted apps, such as apps created with the Wix CLI or Blocks, the framework can initialize and use the client for you, including choosing the authentication strategy.


About the App Dashboard
The App Dashboard is a hub for connecting your app to the Wix ecosystem and managing it.

Regardless of how you are building your app, your journey will most likely include a visit to the App Dashboard.

Working in the App Dashboard
The menu on the left of the dashboard guides you through the tasks for setting up your app. You can progress through most tasks in any order, and return to tasks later, according to your needs.

Generally, the order of the tasks are:

Plan
Get started
Develop and build
Integrate
Launch
Manage
You will learn more about each task below. But first... it is important to note that you can skip tasks you don't need.

Which tasks must I do? Which tasks can I skip?
The tasks you do, and the tasks you skip, are based on the framework you choose and if your app will be public. For example, if your app is private, you can skip many of the options in the Launch task, as there is no need to price, market, or handle payments for your app.

Here are ideas for which tasks to do in the App Dashboard, depending on the type of app you are building.

Public self-hosted app - published in the Wix App Market
Private enterprise app with Wix Blocks
Private app with Wix Blocks
Public app with Wix CLI, published in the Wix App Market
Public app that does not require external integrations, published in the Wix App Market
Getting started
First, log into your Wix Studio account. If you don't already have one, sign up for a Wix Studio account.

Once logged in, set up an app in the App Dashboard. This task lets you set up your app so you can manage it using the App Dashboard.

Developing and building your app
From within the App Dashboard, you can utilize a set of tools and extensions to help you build and release apps. For example, you can:

Extend Wix functionality
Sign up to webhooks
Set up permissions
Set up OAuth
Test the app locally
Integrating your app
You generally develop, code, and design your app outside of the App Dashboard.

This task is about integrating what you developed externally using the App Dashboard.

For example, using the App Dashboard, you can:

Connect any iframes you coded externally, by providing the relevant URLs and settings data.
Integrate with any custom business logic you externally coded by adding a service plugin.
Launching your app
If you are setting up a public app, use the App Dashboard to:

Price your app
Distribute your app
Set up your Market listing. If your app depends on a Wix business solution being installed on a site for your app to work, add the dependency in the App Dashboard when setting up your market listing. This prevents users from installing your app until the relevant business solution is installed.
Create promotional assets
Submit your app for Wix approval. Check the bottom left of the App Dashboard to see if there are any blockers. Did you skip an essential step? Is information missing? Click Fix blockers for a summary of the blockers to fix, including suggestions you might want to consider.
Managing your app
Once your app is up and running, you can make changes. For example, you can:

Respond to reviews
Check analytics
Process refunds
Track statistics
View transactions
Provide coupons for your app
Update your company information
Determine who can collaborate on your app
Make sure your app's users can contact you

About OAuth
Your app must authenticate Wix API calls using the OAuth protocol. You can choose from two options:

OAuth (recommended): A secure and simple method that eliminates the need for redirects and token management.
Custom authentication (legacy): Requires handling redirects and storing refresh tokens. Only use this option if you need to redirect users to an external URL during app installation.
OAuth
OAuth authentication follows the OAuth Client Credentials protocol. Using this approach, you don’t need to implement an OAuth handshake for each installation of your app. Instead, your app can directly request an access token by calling Create Access Token with the following values:

App ID
App secret
The relevant app instance ID
OAuth has the following advantages compared to custom authentication (legacy):

OAuth helps prevent corrupted installations.
OAuth is simpler to implement, since you don't need to setup and run a server for redirects or manage a database for refresh tokens.
With custom authentication (legacy), cloned sites can bypass consent flows, potentially causing issues with refresh tokens. Users may need to reinstall the app to obtain the required refresh token for proper installation.
To get started, see Authenticate Using OAuth.

Custom authentication (legacy)
Wix offers custom authentication to allow for more control over user identification and redirection during the app installation process. Your app should use custom authentication whenever you need to redirect your users to a URL outside the Wix ecosystem during the app installation flow. For example, when you need to automatically create an account using the information in the access token.

Custom authentication follows the industry-standard OAuth 2.0 protocol, which provides a secure way for site owners to grant your app permissions. Whenever a site owner installs your app, your app’s code must complete an OAuth handshake. This requires that you set up a server to handle the relevant redirects. Then, you need to store the refresh token for the new app instance in your database. Finally, you can use the refresh token to retrieve an access token and call the relevant Wix API.

With custom authentication, it’s critical that your app saves the refresh token during installation. If the process fails, you’re unable to retrieve access tokens using Refresh an Access Token. Though from the site owner’s point-of-view, it seems that the app installation has succeeded. You have 2 options in this situation: Ask the site owners to re-install your app, or fall back to retrieving access tokens with the OAuth strategy by calling Create Access Token.

About App Instances
When a Wix user adds your app to their site, Wix generates a new app instance. An app instance represents a unique installation of your app on a specific Wix site. Each app instance has a unique ID (instanceId) that's shared by all of your app extensions and remains the same even if the app is uninstalled and reinstalled.

The instanceId lets you identify your users and manage site-specific data or requirements. You can use it as a foreign key in your own database to efficiently organize data by site, while also accessing additional app instance data that Wix stores through our APIs.

Note: When building a public app for the Wix App Market, you must identify users using the instanceId.

Use cases for app instances
App instances enable you to build scalable, secure, and personalized experiences for each site that installs your app. Depending on your use case, you may need just the instanceId or additional app instance data.

For example, you can use app instances to do the following:

Store site-specific data: Store site-specific settings, configurations, and content using the instanceId as your database key.
Automatically log users in: Automatically log users in to your app using the instanceId.
Manage multi-site users: Manage users with more than one website under a single account, ensuring proper data isolation and access control.
Detect site duplication: Detect site duplication to identify when a site has been duplicated and handle data migration or prompt users to reinstall when necessary.
Monitor usage and billing: Monitor usage and enable features based on each site's subscription plan. Learn more about the app purchase lifecycle, and how to set up a usage-based business model.
Promote upgrades: Send marketing emails based on what plan each site is currently using.
Learn how to get the app instance ID and fetch instance data.

Tip: Subscribe to the App Instance Installed event to save the instanceId when your app is installed on a site.

Automatically log users in to your app
When users access your app through iframes or external dashboards, Wix sends them to your endpoint with a signed app instance query parameter. This data helps you understand which user is accessing your app, from which website, and what their role is, such as website owner or contributor.

Consider these approaches for automatic login:

Authenticate users by instanceId: When users access your app, use the instanceId from the signed app instance parameter to create a user session or link to an existing account, eliminating the need for separate login credentials.
Differentiate access levels by role: Check the permissions field to determine if the current user is the site owner or a contributor, then grant appropriate access to features and data for that specific site.
Enable seamless multi-site access: Use the combination of uid (user ID) and instanceId to allow the same person to access multiple sites they manage without re-authenticating, while keeping each site's data separate.
Manage users with more than one website
Wix users can create thousands of websites under the same Wix account. There are many reasons for this, ranging from small businesses creating multiple websites for different products, to large partners creating thousands of websites for their clients. That's why apps must support users with multiple sites.

Consider these approaches for multi-site support:

Separate business data per site: Use the instanceId as your primary database key to isolate data between sites, even when the site owner uses the same email address across multiple business websites. This ensures that Site A's customer data, inventory, or settings don't appear when the user accesses your app from Site B.
Control dashboard access by role: Check the permissions field in the app instance data to determine if the current user is the site owner or a contributor. Use this with the instanceId to ensure contributors can only access data for sites where they have permissions, preventing them from switching between sites they shouldn't see.
Enable cross-site workflows for power users: Some users manage multiple related sites and need to switch between them frequently. Implement a site-switching feature in your external dashboard by storing the relationship between the user's Wix account ID and multiple instanceId values, then let verified site owners toggle between their sites without returning to Wix.
Detect site duplication
The originInstanceId property indicates whether the current site was duplicated from another site. If originInstanceId is present, it contains the instanceId of the original installation. If it's missing or empty, the site wasn’t duplicated. Wix includes this property when you retrieve instance data using the REST API, SDK, encoded instance query parameter, or the app instance installed event.

Consider these approaches for handling site duplication:

Migrate data from the original site: If your app stores site-specific data, use the originInstanceId to query your database for the original site's configurations, user data, or content, then copy it to the new instanceId to maintain continuity.
Preserve user preferences across sites: If your app has customizable settings, use the originInstanceId to inherit preferences like language, dashboard layouts, or feature configurations from the original site, then allow users to customize them for the duplicated site.
Caution: When a site is duplicated, a new app instance is created without triggering the consent flow. If your app uses custom authentication (legacy), this means no refresh token is generated. To address this, you can either:

Prompt users to reinstall the app to trigger the consent flow and generate a refresh token.
Authenticate using OAuth to generate an access token using the instanceId, app ID, and app secret.
Get the app instance ID
The instanceId uniquely identifies your app on a site. You can get it from:

Get Token Info method (SDK | REST)
Event payloads
Service plugin metadata
getDecodedAppInstance() for Wix Blocks
App instance query parameter for iframes and external pages
Important: These methods don't return exactly the same set of properties.

The method depends on your environment:

Frontend environments: Send tokens to your backend for decoding. See Identify the App Instance in Frontend Environments.
Backend environments: Extract directly from request data or decode from tokens. See Identify the App Instance in Backend Environments.
iframes and external pages: Parse the app instance query parameter.
Warning: Don't trust an instanceId sent to your backend as plain text, as it can be manipulated by an attacker.

Fetch instance data from Wix APIs
Wix stores specific data about each app instance, which can be accessed using the following methods based on your use case:

REST API and SDK: Call Get App Instance to get details about your app on the site, independent of user context (unlike the app instance query parameter).
Velo API: Call getDecodedAppInstance() to get the instanceId and the vendorProductId, which is the ID of the plan that the site owner purchased. This can only be called from Blocks frontend code.
Note: Wix Blocks apps should generally follow the same guidance as other apps, especially if the instanceId is required on the backend.

App instance query parameter
When users access your app through certain frontend interactions, Wix automatically sends app instance data as an encoded instance query parameter to your app's endpoints. This parameter contains the instanceId plus additional context like user information and site details. The data is signed to ensure it hasn't been tampered with.

This is particularly useful for apps that need to know which site they're running on and who the current user is without making additional API calls.

Apps that receive the app instance query parameter include:

iframe apps
External dashboard apps (when a user clicks Open App)
Apps with an external pricing page (when a user clicks Upgrade App)
Learn how to parse the app instance query parameter.







> **Status:** Curated reference (updated 2025-10-30) for building a **Wix self‑hosted app** hosted on **Render + PostgreSQL** with **Wix App Billing**. It consolidates the 2025 docs landscape: quick‑starts, CLI, extensions, Stores Catalog V3, billing, scopes, webhooks, and deployment patterns. Copy sections into Codex/agents as scaffolding.

---

## 1) Official 2025 Docs — Start Here

- **Quick Start — Create a Self‑Hosted App (Tutorial):**  
  https://dev.wix.com/docs/build-apps/get-started/quick-start/create-a-self-hosted-app

- **Build Apps (Docs Hub / Index):**  
  https://dev.wix.com/docs/build-apps

- **Quick Starts Overview (choose framework — Blocks / CLI / Self‑hosted):**  
  https://dev.wix.com/docs/build-apps/get-started/quick-start/about-the-quick-starts

- **Wix CLI for Apps — Command Reference:**  
  https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-cli/app-development/command-reference

- **Dashboard Extensions — Overview + Types:**  
  About extensions: https://dev.wix.com/docs/build-apps/develop-your-app/extensions/dashboard-extensions/about-dashboard-extensions  
  Dashboard page: https://dev.wix.com/docs/build-apps/develop-your-app/extensions/dashboard-extensions/dashboard-pages/about-dashboard-page-extensions  
  Add self‑hosted dashboard page: https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/self-hosting/supported-extensions/dashboard-extensions/add-self-hosted-dashboard-page-extensions  
  Add dashboard page with CLI: https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-cli/supported-extensions/dashboard-extensions/dashboard-pages/add-dashboard-page-extensions-with-the-cli  
  Dashboard plugins: https://dev.wix.com/docs/build-apps/develop-your-app/extensions/dashboard-extensions/dashboard-plugins/about-dashboard-plugin-extensions

- **App Billing (App‑management APIs):**  
  Intro: https://dev.wix.com/docs/api-reference/app-management/app-billing/introduction  
  Billing “Get URL” for checkout + external pricing pages: https://dev.wix.com/docs/api-reference/app-management/app-billing/billing/introduction

- **Stores Catalog — 2025 migration (V1 → V3) & APIs:**  
  Catalog intro: https://dev.wix.com/docs/api-reference/business-solutions/stores/introduction  
  Catalog versioning: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/introduction  
  Catalog V3 intro: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/introduction  
  Products V3 API: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/introduction

- **What’s New / Release Notes:**  
  https://dev.wix.com/docs/build-apps/get-started/what-s-new/build-apps-release-notes

> Tip: Use the **Catalog Versioning API** to detect V1 vs V3 at runtime before calling Stores endpoints.

---

## 2) Architecture (Render + PostgreSQL + Self‑Hosted)

**Target stack**  
- **Web service:** Node.js (Express/Fastify) on Render (HTTPS).  
- **Database:** Render PostgreSQL.  
- **Secrets:** Render Environment Variables (no client exposure).  
- **Auth:** Wix OAuth 2.0 (server‑side).  
- **Extensions:** Self‑hosted **Dashboard Page** (iframe) + optional **Dashboard Plugins**.  
- **Billing:** Wix App Billing — redirect to Wix Checkout via Billing `getUrl()`; receive webhooks for plan/changes.  
- **Stores:** Use **Catalog Versioning** to decide V1 or V3 APIs per site.

```
Wix Site Admin → Installs App
   ↳ OAuth consent → Your Server (/oauth/callback)
      ↳ Exchange code → access_token (store per site instance)
         ↳ Render DB: {{ siteId, instanceId, tokens, scopes, plan, createdAt }}
Dashboard Page (iframe) → loads https://yourapp.com/dashboard?instance=...
   ↳ Verify signed instance/query, fetch tenant by instanceId
   ↳ Call Wix APIs on behalf of the site using stored tokens
Billing flows/webhooks → update subscription & limits
```

---

## 3) App Registration & OAuth

1. **Create the app** in **Wix Studio → Custom Apps → My Apps → Create New → Build from scratch → Self‑Hosted**.  
2. Configure **Redirect URIs** (e.g., `https://yourapp.com/oauth/callback`).  
3. Add **OAuth scopes** required by your features (e.g., Stores, Billing).  
4. Create a **Dashboard Page extension** that points to your external URL (iframe).

**Server OAuth endpoints (Express example):**
```ts
import express from "express";
import axios from "axios";
import crypto from "crypto";

const app = express();

// env
const {{ WIX_APP_ID, WIX_APP_SECRET, WIX_REDIRECT_URI }} = process.env;

// Helper to exchange code
async function exchangeCodeForToken(code: string) {{
  const url = "https://www.wix.com/oauth/access";
  const body = new URLSearchParams({{
    grant_type: "authorization_code",
    client_id: WIX_APP_ID!,
    client_secret: WIX_APP_SECRET!,
    code,
    redirect_uri: WIX_REDIRECT_URI!,
  }});
  const {{ data }} = await axios.post(url, body.toString(), {{
    headers: {{ "Content-Type": "application/x-www-form-urlencoded" }},
  }});
  return data; // {{ access_token, refresh_token, expires_in, ... }}
}}

app.get("/oauth/callback", async (req, res) => {{
  const {{ code, state }} = req.query as any;
  // TODO: verify 'state' if you set it; validate HMAC on instance if provided
  const token = await exchangeCodeForToken(String(code));
  // Persist token by site/instance
  // redirect to dashboard
  res.redirect("/dashboard");
}});

// Token refresh (use on 401s)
async function refreshToken(refresh_token: string) {{
  const url = "https://www.wix.com/oauth/access";
  const body = new URLSearchParams({{
    grant_type: "refresh_token",
    client_id: WIX_APP_ID!,
    client_secret: WIX_APP_SECRET!,
    refresh_token,
  }});
  const {{ data }} = await axios.post(url, body.toString(), {{
    headers: {{ "Content-Type": "application/x-www-form-urlencoded" }},
  }});
  return data;
}}

app.listen(8100);
```
> Store tokens securely in Postgres; rotate on refresh; never expose from client code.

---

## 4) Extensions (Dashboard Page + Plugins)

- **Dashboard Page (self‑hosted iframe):** Use as your app UI entrypoint.  
  Docs: see links in Section 1.  
- **Dashboard Plugins:** Optional widgets within Wix’s dashboard pages to surface key metrics/CTA.  
- **Routing:** The “route” in CLI is the dashboard sub‑path (e.g., `/dashboard` or `/product-optimizer`). For a **sidebar‑driven** app, make the route `/dashboard` and implement internal tabs/sections for sub‑features.

**Verify requests from Wix:** Dashboard page receives `instance` (signed). Verify HMAC server‑side before trusting IDs.

---

## 5) Wix Stores — Catalog V3 Readiness (2025)

- **V3 rollout:** Q2 2025, progressively replacing V1.  
- **Sites are either V1 or V3** — **not** both; detect via **Catalog Versioning API** before calling endpoints.  
- **Key V3 endpoints:** Products V3 (create/update/query), with enhanced variant/inventory granularity.

**Runtime detection pattern:**
```ts
// Pseudo: call catalog-versioning endpoint, then branch
const version = await getCatalogVersion(siteId);
if (version === "V3") {{
  // call /stores/catalog-v3/products
}} else {{
  // call /stores/v1 endpoints
}}
```

**References:**  
- Intro (Stores): https://dev.wix.com/docs/api-reference/business-solutions/stores/introduction  
- Versioning: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/introduction  
- Catalog V3 intro: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/introduction  
- Products V3: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/introduction

---

## 6) Billing — Plans, Credits, and Checkout

**Approach:** Manage your own pricing UI (Render), then **redirect to Wix Checkout** using Billing API `getUrl()`; subscribe to billing webhooks to adjust tenant limits/credits.

- **Docs:**  
  App Billing intro: https://dev.wix.com/docs/api-reference/app-management/app-billing/introduction  
  Billing “Get URL” & flows: https://dev.wix.com/docs/api-reference/app-management/app-billing/billing/introduction

**Plan/credits model (example):**
- Each “Generate” job = 1 credit.  
- Track `credits_remaining`, `plan_tier`, `renewal_date` in Postgres.  
- On **webhook** `plan.updated` or `subscription.canceled`, update entitlements.  
- Grace/overage rules: enforce server‑side before queueing jobs.

---

## 7) Server Endpoints (Template)

```
POST /api/jobs             → enqueue AI job (checks credits & plan)
GET  /api/jobs             → list jobs (filters: status=queued|running|done|error)
GET  /api/jobs/:id         → job detail
POST /api/billing/webhook  → handle Wix billing events (verify, update plan)
GET  /api/stores/products  → proxy to Wix Stores (V1 or V3 based on versioning)
GET  /api/me               → whoami (site/instance, plan, credits)
```

**Billing webhook skeleton:**
```ts
app.post("/api/billing/webhook", express.raw({{ type: "application/json" }}), (req, res) => {{
  // TODO: verify signature if provided by Wix (check docs)
  const event = JSON.parse(req.body.toString());
  switch (event.type) {{
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
      // update tenant plan/credits
      break;
  }}
  res.sendStatus(200);
}});
```

---

## 8) Frontend (Dashboard) Integration

- Load dashboard via the extension URL (iframe).  
- Read the `instance` parameter; send it to your server to exchange for a session (don’t do API calls directly from the iframe).  
- Implement tabs for: **Product Optimizer**, **Bulk Tools**, **Jobs (Ongoing/Completed)**, **Billing & Credits**, **Settings**.

**Typical flow (Product Optimizer):**
1. User selects **products/collections** (fetch via your server).  
2. Chooses attributes: **title, description, SEO, metadata**, language, custom prompt.  
3. Click **Generate** → server validates plan/credits → enqueues job → returns `jobId`.  
4. Jobs page polls or uses SSE/WebSocket for updates.  
5. On completion, user reviews diffs → **Apply** (PATCH to Stores API).

---

## 9) CLI Commands (Wix CLI for Apps)

- **Scaffold / generate:**  
  ```bash
  npm create wix@latest
  # or
  npx @wix/cli create
  ```
- **Add dashboard page extension (CLI app path):**  
  ```bash
  wix app generate
  # choose: Dashboard Page
  # Route suggestion for a sidebar app: /dashboard
  ```
- **Run locally (if applicable for CLI projects):**  
  ```bash
  wix app start
  ```

> For **self‑hosted** apps, you still use the **App Dashboard** (Custom Apps) to register, set OAuth, and add extensions that point to your external URLs. Use the CLI only if you also maintain a CLI‑based variant or want extension stubs.

Docs: command reference — https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-cli/app-development/command-reference

---

## 10) Environment & Secrets

- **Use Render Environment Variables** for: `WIX_APP_ID`, `WIX_APP_SECRET`, `WIX_REDIRECT_URI`, `DB_URL`, AI keys, etc.  
- **Never** store secrets in the client or dashboard iframe code.  
- If you need per‑tenant secrets, encrypt at rest in Postgres and only decrypt server‑side.

---

## 11) Deployment on Render

1. **Create Web Service** (Node 18+), set **Build Command** (e.g., `npm ci && npm run build`) and **Start Command** (e.g., `node dist/server.js`).  
2. **Create Render PostgreSQL** and set `DATABASE_URL` in the service **Environment**.  
3. Add **WIX_* secrets** to Environment.  
4. Ensure HTTPS and public URL (required for OAuth redirect & dashboard iframe).  
5. Whitelist your domain in the App settings; set **Redirect URL** to `/oauth/callback`.  
6. Open firewall if you restrict egress/ingress (Wix billing/webhooks must reach your `/api/billing/webhook`).

---

## 12) Stores API Snippets (V3 + fallback)

**Query products (V3):**
```ts
const base = "https://www.wixapis.com";
const token = /* your stored access token */ "";

const data = await axios.post(
  base + "/stores/catalog-v3/products/query",
  {{ query: {{ paging: {{ limit: 50, offset: 0 }} }} }},
  {{ headers: {{ Authorization: token }} }}
);
```

**Apply updates (e.g., title/description):**
```ts
await axios.patch(
  base + "/stores/catalog-v3/products/{productId}",
  {{ product: {{ name: "New title", description: "<p>Optimized</p>" }} }},
  {{ headers: {{ Authorization: token }} }}
);
```

**Fallback (V1) — detect first using Versioning API**

---

## 13) Billing — Checkout URL & Entitlements

**External pricing page pattern:**  
- Show plans and **CTA → “Subscribe”**.  
- On click, call your server → **Billing `getUrl()`** → redirect user to Wix Checkout.  
- On success, webhook updates tenant `plan_tier` and issues **credits**.

> Enforce **server‑side** credit checks before scheduling a job.

---

## 14) Data Model (Postgres Sketch)

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  instance_id text not null unique,
  access_token text not null,        -- optionally encrypt
  refresh_token text not null,
  token_expires_at timestamptz not null,
  plan_tier text not null default 'free',
  credits_remaining int not null default 0,
  catalog_version text,              -- 'V1' | 'V3'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  kind text not null,                -- 'product_optimize'
  payload jsonb not null,            -- product ids, prompt, language, attrs
  status text not null default 'queued', -- queued|running|done|error
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 15) Security Checklist

- Validate **instance** signature from Wix on every dashboard request.  
- Store/rotate tokens; refresh on 401; use least‑privilege scopes.  
- CSRF protection on dashboard actions; use same‑site cookies for **session**.  
- Webhook authenticity: verify signatures/timestamps when provided.  
- Strict CORS: only allow Wix dashboard origins for the iframe.  
- Audit logs (billing changes, token refreshes, product writes).

---

## 16) Troubleshooting (2025‑specific)

- **Only “Delete” appears after install (no dashboard UI):**  
  Ensure you **added a Dashboard Page extension** and **installed** the app on the site. The dashboard page appears under **Apps** in the site’s Dashboard once the extension exists and the URL is reachable (200/HTTPS).

- **Catalog V1 vs V3 errors (e.g., calling V1 on a V3 site):**  
  Use **Catalog Versioning API** to branch logic. Do **not** mix V1/V3 on the same site.

- **403/428/500 from Stores endpoints:**  
  - 403: missing scope or wrong token audience/instance. Re‑authorize with proper scopes.  
  - 428: precondition failed / wrong catalog version endpoint.  
  - 500: transient server error; retry with backoff; log `requestId` for Wix support.

- **Where to store secrets?**  
  In **Render Environment Variables** (server‑side). Do not rely on legacy “My Apps → Secrets” UX; treat your server as source of truth.

---

## 17) Minimal .env (server)

```
PORT=8100
DATABASE_URL=postgres://...
WIX_APP_ID=
WIX_APP_SECRET=
WIX_REDIRECT_URI=https://yourapp.com/oauth/callback
AI_API_KEY=
```

> On Render, set these in the service **Environment** (not committed to git).

---

## 18) Project Structure (suggested)

```
/src
  /server
    index.ts
    oauth.ts
    billing.ts
    stores.ts
    jobs.ts
    auth.ts
  /db
    prisma.ts (or knex/pg)
  /dashboard
    index.html (iframe app shell) → SPA (React/Next/Vite)
/infra
  render.yaml (optional)
```

---

## 19) Pre‑flight Checklist for Production

- [ ] OAuth configured; redirect verified over HTTPS.  
- [ ] Dashboard page extension added; iframe URL loads with valid cert.  
- [ ] Catalog version detection implemented.  
- [ ] Billing redirect & webhook tested end‑to‑end.  
- [ ] Rate limiting & retries for Wix API calls.  
- [ ] PII/data retention policy documented.  
- [ ] Monitoring: logs, alerting, job queue visibility.  
- [ ] Backups enabled on Render PostgreSQL.

---

## 20) Useful References (2025)

- Quick Start (Self‑Hosted): https://dev.wix.com/docs/build-apps/get-started/quick-start/create-a-self-hosted-app  
- Build Apps Portal: https://dev.wix.com/docs/build-apps  
- Release Notes: https://dev.wix.com/docs/build-apps/get-started/what-s-new/build-apps-release-notes  
- Dashboard extensions (overview/pages/plugins): see Section 1.  
- CLI command reference: https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-cli/app-development/command-reference  
- Stores Catalog V3 (and versioning): see Section 5.  
- App Billing APIs: see Section 6.

---

### Attribution & Notes
- This reference compiles publicly available Wix docs (2025) and aligns with the Stores **Catalog V3** migration and **App Billing** behaviors described in the official documentation.
