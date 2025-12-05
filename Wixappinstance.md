getAppInstance( )
Retrieves data about the instance of your app that's installed on a Wix site and data about the site itself. For example, to check whether the Wix user has installed a free or paid version of your app, or to check which apps made by Wix are installed on the site.

You must authenticate this method as a Wix app.

To retrieve site.ownerInfo in the response, you must have the READ SITE OWNER EMAIL permission scope in addition to MANAGE YOUR APP.

Authentication
When developing websites or building an app with Blocks, this method may require elevated permissions, depending on the identity of the user calling it and the calling user's permissions.
When building apps without Blocks or for headless projects, you can only call this method directly when authenticated as a Wix app or Wix user identity. When authenticated as a different identity, you can call this method using elevation.
Elevation permits users to call methods they typically cannot access. Therefore, you should only use it intentionally and securely.
Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function getAppInstance(): Promise<GetAppInstanceResponse>;
Request
This method does not take any parameters
Returns
Return Type:
Promise<GetAppInstanceResponse>
Show GetAppInstanceResponse Properties
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

async function getAppInstance() {
  const response = await appInstances.getAppInstance();
}
Errors
This method doesn't return any custom errors, but may return standard errors. Learn more about standard Wix errors.

Did this help?

Yes

No
onAppInstanceInstalled( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when an instance of your app is installed on a Wix site.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstanceInstalled(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstanceInstalledEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstanceInstalled((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePaidPlanAutoRenewalCancelled( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when a Wix user either cancels a paid plan for your app, or cancels the plan's auto-renewal. The Wix user can continue to use your app until the end of the current billing cycle.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePaidPlanAutoRenewalCancelled(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePaidPlanAutoRenewalCancelledEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePaidPlanAutoRenewalCancelled((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePaidPlanChanged( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when a Wix user upgrades or downgrades their plan for your app.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePaidPlanChanged(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePaidPlanChangedEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePaidPlanChanged((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePaidPlanPurchased( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when a Wix user purchases a paid plan for your app.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePaidPlanPurchased(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePaidPlanPurchasedEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePaidPlanPurchased((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePlanConvertedToPaid( )
Developer Preview
This API is subject to change. Bug fixes and new features will be released based on developer feedback throughout the preview period.

Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when a Wix user reaches the end of a free-trial period and is charged successfully.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePlanConvertedToPaid(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePlanConvertedToPaidEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePlanConvertedToPaid((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePlanReactivated( )
Developer Preview
This API is subject to change. Bug fixes and new features will be released based on developer feedback throughout the preview period.

Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when auto-renewal is turned on for a paid plan.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePlanReactivated(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePlanReactivatedEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePlanReactivated((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstancePlanTransferred( )
Developer Preview
This API is subject to change. Bug fixes and new features will be released based on developer feedback throughout the preview period.

Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when a paid plan for your app is transferred to a different Wix account.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstancePlanTransferred(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstancePlanTransferredEnvelope): void | Promise<void>

Show function Parameters
Example shown:
JavaScript
import { appInstances } from "@wix/app-management";

appInstances.onAppInstancePlanTransferred((event) => {
  // handle your event here
});
Did this help?

Yes

No
onAppInstanceRemoved( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when an instance of your app is uninstalled from a Wix site.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstanceRemoved(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstanceRemovedEnvelope): void | Promise<void>

Show function Parameters

onAppInstanceRemoved( )
Notes:
This method registers a callback function as an event handler.
When developing websites or building apps with Blocks, use a Velo backend event instead of this method.
When building apps not using Blocks, the way you call this method differs depending on the framework you are working in:
When using the CLI, run the generate command to add an event extension, and then call this method within the extension code.
When building a self-hosted app, subscribe your app to the relevant event, and then call this method on your server.
Triggered when an instance of your app is uninstalled from a Wix site.

Permissions
Manage Your App
Learn more about 
.
Method Declaration
Copy
function onAppInstanceRemoved(handler: function): void;
Method Parameters
handler
function
handler(event: AppInstanceRemovedEnvelope): void | Promise<void>

Show function Parameters

