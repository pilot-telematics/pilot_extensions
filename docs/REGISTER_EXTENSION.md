# Register and Enable a PILOT Extension

This guide explains how to register a hosted Extension in the separate PILOT Admin Panel, grant account access, set Extension settings, and enable the Extension in PILOT.

For hosting instructions, see [the deployment guide](../DEPLOY.md). For Extension development, see [the developer guide](HUMAN_EXTENSION_GUIDE.md).

## Before you start

1. Host the Extension files at a public base URL.
2. Open the Extension entry file directly at `<base-url>/Module.js`. Confirm that the browser shows JavaScript source and not an error page.
3. Use a unique lowercase `snake_case` name in the Admin Panel and in the Ext JS class name. Check that no Extension already uses that name. For example, the name `weather_demo` requires `Store.weather_demo.Module`.
4. Use the base URL in the Admin Panel. Do not enter the `Module.js` URL as the base URL. A trailing slash is recommended. The current PILOT configuration generator adds it if it is missing. The URL must still point to the folder that contains `Module.js`.

Example:

| Purpose | URL |
|---|---|
| Verify the entry file | `https://example.com/weather_demo/Module.js` |
| Register in the Admin Panel | `https://example.com/weather_demo/` |

## Register the Extension in the Admin Panel

The PILOT Admin Panel is a separate web interface. Do not look for Extension registration in the PILOT user interface.

1. Open the Admin Panel URL and sign in.
2. Open **Extensions** in the left menu. This opens the **Extensions** list.
3. Select **Add**.
4. Edit the new row and enter these fields. **Add** creates the row. **Update** saves the completed row or changes to an existing row.

| Field | Value |
|---|---|
| **Name** | Unique technical Extension name in lowercase `snake_case`, such as `weather_demo`. It must match the class name in `Module.js`. Check that no Extension already uses it. |
| **Name Pretty** | Name shown to PILOT users. |
| **Description** | Short description shown in PILOT. |
| **URL** | Hosted base URL, such as `https://example.com/weather_demo/`. |
| **Is Published** | Select this when users can see and enable the Extension. |
| **Icon class** | The star icon is selected by default. Keep it or choose another icon from the list. Changing it is optional. |
| **Author** | Name shown as the Extension author. |

5. Select **Update** to save the row. The Admin Panel checks the URL. Confirm that the URL is accepted and that the entry appears in the Extensions list.

In the current PILOT deployment, the store proxy configuration refreshes every 10 minutes. Allow up to 10 minutes after you add an Extension or change its URL. Then reload PILOT.

**Note:** **Add** creates a record before row editing is complete. If you abandon a new entry, check the list and remove the unused record with its delete action.

![Extensions list with the Add control and Extension fields](images/01-extensions-list.png)

![Example Extension registration row](images/02-extension-registration.png)

## Grant access to accounts

1. In the **Extensions** list, select the gear icon on the Extension row.
2. Open the **Access** tab.
3. Choose one access mode:
   - Leave **Available to all accounts** selected to grant access to all accounts.
   - Clear it to select the accounts that can use the Extension. Mark each required account as available.
4. Select **Save access**.

Keep these states separate:

- **Is Published** in the Admin Panel controls whether the Extension is published for users.
- **Account access** controls whether the current account can see and use the Extension.
- **Show drafts** changes which entries appear in the PILOT Extensions list. This filter does not publish an Extension or grant access.
- The **active switch** in the PILOT user interface enables or disables the Extension for the current user.

To make an Extension available to a user, confirm publication and access for that user's account. Then enable its active switch in PILOT.

To set account-specific values while keeping the Extension available to all accounts, leave **Available to all accounts** selected. Then select **Choose accounts for individual settings** and link the accounts that need their own values. This list does not change who can access the Extension.

![Access tab with account availability controls](images/03-extension-access.png)

## Set global or account-specific settings

1. Open the Extension settings window from the gear icon.
2. Select the **Settings** tab.
3. Select **Add**.
4. Choose **Global** or a linked account.
5. Enter a key and value. Repeat for each setting.
6. Select **Save settings**.

Global settings apply as defaults. Account settings override global values with the same key. Link an account in **Access** before you add settings for it.

Values returned to Extension JavaScript are available in the browser. Do not store passwords, private keys, or other secrets in these settings. Use server-side configuration for secrets. See [the runtime settings API](PILOT_RUNTIME_UTILS.md#extension-settings-api).

![Settings tab with global and account-specific values](images/04-extension-settings.png)

## Enable the Extension in PILOT

1. Sign in to PILOT with a user from an account that has Extension access.
2. Open the top-right menu.
3. Select **Extensions**.
4. Find the Extension in the list.
5. Turn on its active switch.
6. Close the window or select the Extension from the PILOT menu. Reload PILOT if the Extension does not appear.

The Extensions list shows the Extensions available to the current account. The active switch controls whether the Extension is loaded for the current PILOT user.

If the list has a **Show drafts** option, do not use it as a substitute for publication or account access. If the Extension appears only when this option is selected, return to the Admin Panel and check **Is Published** and access for the current account. After configuration changes, allow up to 10 minutes and reload PILOT.

![Open Extensions from the PILOT menu](images/06-pilot-extensions-menu.png)

![PILOT Extensions list with the active switch](images/05-pilot-extensions.png)

## Troubleshooting

| Problem | Check |
|---|---|
| Extension is missing from the PILOT list | Confirm that the record is saved, **Is Published** is selected, and the current account has access. If the list has **Show drafts**, note whether visibility changes when you select it. Do not treat this filter as a substitute for publication. After a record or URL change, allow up to 10 minutes and reload PILOT. |
| Extension appears but does not load | Confirm that the Admin Panel name matches `Store.<name>.Module` in `Module.js`. Check the base URL and confirm that `Module.js` opens directly. |
| Changes do not appear | Reload PILOT, then reopen **Extensions**. |
| Account setting cannot be added | Link the account in the **Access** tab first. |
| Extension cannot reach its backend | Use the same-origin `/store/<extension>/backend/` proxy path. See [the deployment guide](../DEPLOY.md). |

## Update an existing Extension

1. Keep the Extension name and current base URL. Do not create a second Admin Panel record.
2. Update the files in the same hosting project. For Cloudflare Workers, open the existing project and select **New deployment**. Upload the new version to this project.
3. Publish a Production deployment. Do not select Preview when PILOT must load the update.
4. Open `Module.js` at the same public URL. Find the version marker or unique change that you selected before deployment.
5. Reload PILOT and check the Extension.

If the base URL changes, update the URL in the existing Admin Panel record. Then allow up to 10 minutes for the proxy configuration to refresh.

## Related guides

- [Deployment and hosting](../DEPLOY.md)
- [PILOT Extension developer guide](HUMAN_EXTENSION_GUIDE.md)
- [Runtime settings API](PILOT_RUNTIME_UTILS.md)
- [API compatibility and support boundaries](PILOT_API_COMPATIBILITY.md)
