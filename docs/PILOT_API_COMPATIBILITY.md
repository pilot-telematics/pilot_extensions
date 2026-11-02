# PILOT API Compatibility and Support Boundaries

This guide explains how to select PILOT interfaces for an Extension. It separates documented contracts from runtime observations and installation-specific behavior.

Last reviewed: 2026-11-02.

## Compatibility scope

The [public PILOT user guide](https://docs.pilot-gps.com/current/what_s_new_in_pilot_7_10.html) identifies version 7.10. The `Pilot7` workspace also contains release files for 7.11. Those files do not prove which release runs on a customer installation. Confirm the target version before you rely on version-specific behavior.

This review confirms the published 7.10 release notes. It does not confirm every Extension runtime detail against a deployed 7.10 build.

The 7.10 notes say that the PILOT AI Assistant can guide developers on API use and Extension creation. They do not define a new Extension runtime or API contract. Use this repository's guides for Extension work, and verify API behavior against the current PILOT API specification.

The Extension repository describes its own integration patterns. It does not define the contract for every PILOT API endpoint or account setting.

## Support levels

Use these labels in Extension documentation and code reviews:

| Label | Meaning | How to use it |
|---|---|---|
| Documented API | The current PILOT API specification defines the endpoint, fields, and authentication. | Use it as the primary integration contract. |
| Documented Extension runtime | This repository documents a host object or integration pattern. | Check optional classes and methods before use when the guide says they can vary. |
| Legacy interface | The PILOT UI uses the endpoint, but the public API specification does not define it for Extensions. | Avoid it for new integrations unless PILOT confirms support and compatibility. |
| Runtime observation | The behavior was found in a build or observed in one installation. | Treat it as version-specific evidence. Do not present it as a stable contract. |
| Installation policy | A setting belongs to a specific server, account, proxy, or WAF. | Confirm it with the owner of that installation. |

A successful request or a working sample does not change the support level of an interface.

## Choose an API source

1. Use the current PILOT API v3 specification when it defines the required operation.
2. Check the response schema before you depend on a field. Do not rely on fields that appear in a response but are absent from the published schema.
3. Use a legacy `/backend/ax/...` endpoint only when the feature is not available in the documented API and PILOT confirms that the endpoint is supported for Extensions.
4. Record the PILOT version, endpoint, method, authentication method, response fields, and known limits in the Extension documentation.

The API v3 vehicle list may include runtime data that the OpenAPI schema does not define. Treat those extra fields as observations until the API specification includes them.

## PILOT Extension settings

`Pilot.Extensions.getSettings(name, scope)` is a documented host runtime API in PILOT builds that include the `Pilot.Extensions` class.

The method uses the current authenticated PILOT session. PILOT selects the current account and checks Extension access. The method does not accept an account ID.

The default scope, `effective`, combines global settings with current-account settings. Account values replace global values with the same key. The `account` scope returns only current-account settings. The `global` scope returns only global settings. A scope with no values returns an empty object.

Use the JavaScript method. Do not call its legacy `/backend/ax/pilotstore/list.php` endpoint directly. The method rejects its promise when the session is not authenticated, the account cannot access the Extension, or the request has invalid parameters.

Values returned to the browser are visible to its users. Do not store passwords, private keys, or other secrets in these settings. Use a server-side Extension backend for secret values.

## Authentication and authorization

PILOT interfaces can use different authentication methods. Do not assume one token format works for every endpoint.

- Follow the authentication section of the API specification for documented API endpoints.
- Do not treat a browser session identifier as a general-purpose API token.
- Do not assume that an Extension's same-origin `/store/<extension>/...` URL provides authentication or authorization.
- Enforce permissions in the Extension backend for data that the user must not access.
- Treat `global_conf`, `CurrentUser`, role IDs, module lists, and similar runtime values as unsupported for access-control decisions unless PILOT documents them as stable Extension APIs.
- Distinguish authentication failures from permission failures. A `401` usually means the request is not authenticated. A `403` usually means the authenticated user lacks permission. Check the endpoint contract for exact behavior.

Do not use private WebSocket message formats as an Extension API. Use a documented endpoint for live or historical data. If no supported endpoint exists, request one from PILOT.

## Request volume and polling

Do not describe an observed request rate as a formal PILOT quota. Use a published limit only when the API contract or installation owner defines it.

When no limit is published:

- request only the data that changed;
- cache responses when the data can be reused;
- split large jobs into batches;
- stagger requests across vehicles;
- retry temporary failures with backoff;
- stop retrying authentication and permission failures until credentials or access change.

Limits can differ by endpoint and installation. A server rule for one URL group does not establish a limit for other endpoints.

## Data and time semantics

For each displayed metric, document its source, unit, calculation, period, filters, and known data delay. Use the API schema for field names and types. Use product documentation or a confirmed data definition for business meaning.

Always state the time zone used by date and time parameters. Do not infer an account time zone from the browser or server clock. State whether a response describes current state, an event history, or an aggregate.

Do not label a metric as cleaned or validated unless its source applies the relevant validation. An aggregate can preserve anomalies that exist in its input data.

## Error handling

| Response | Default handling |
|---|---|
| `401` | Check whether the request includes valid credentials for this endpoint. Do not keep retrying with the same credentials. |
| `403` | Check the user's rights and account access. Do not assume that the account module is disabled. |
| `429` | Reduce request rate and retry after the documented delay, if the response provides one. |
| `500` | Record a request identifier and time, then report a server failure. Do not present it as a permissions error. |

The endpoint may define more specific error behavior. Use that definition when available.

## Report an integration problem

Include these details in a support request:

1. PILOT version and installation host.
2. Endpoint, HTTP method, and request time with time zone.
3. Sanitized request parameters and response body.
4. HTTP status and request identifier, if available.
5. User role and relevant access rights. Do not send passwords, cookies, session IDs, or bearer tokens.
6. Vehicle count, date range, request frequency, and cache behavior.
7. Whether the same operation fails in the PILOT interface.

Remove customer names, account identifiers, vehicle identifiers, and credentials from examples intended for public documentation.

## Version review

When the target PILOT release changes, review the API specification and Extension runtime reference. Check every example that uses a host class, map method, global variable, legacy endpoint, or undocumented response field. Update the compatibility statement only after the target build confirms the behavior.
