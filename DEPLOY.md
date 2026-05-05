# PILOT Extensions Deployment Guide

This document explains where and how to host `Module.js` files for PILOT Extensions.

A PILOT Extension is loaded by URL. The public entry point is usually:

```text
https://YOUR-HOST/Module.js
```

or, if you prefer grouping several extensions:

```text
https://YOUR-HOST/weather/Module.js
https://YOUR-HOST/loadshedding/Module.js
```

## Quick decision table

| Hosting option | Use when | Backend/API proxy | PHP support | Difficulty |
|---|---|---:|---:|---:|
| Cloudflare Workers static assets | Static module, easy upload, optional Worker proxy | Yes | No | Easy |
| GitHub Pages | Static module only, no secrets, no proxy | No | No | Easy |
| AWS EC2 VPS | You need Nginx, PHP-FPM, custom backend, private proxy, logs | Yes | Yes | Medium |

## Recommended upload folder structure

For the simplest workshop/demo deployment, keep `Module.js` in the upload root:

```text
extension-upload/
├── index.html
├── Module.js
├── extension.css
└── doc/
    └── index.html
```

After deployment, these URLs should work:

```text
https://YOUR-HOST/
https://YOUR-HOST/Module.js
https://YOUR-HOST/extension.css
https://YOUR-HOST/doc/index.html
```

This avoids confusion between:

```text
https://YOUR-HOST/Module.js
```

and:

```text
https://YOUR-HOST/weather/Module.js
```

If you upload a parent folder that contains `weather/Module.js`, then your final URL will be:

```text
https://YOUR-HOST/weather/Module.js
```

not:

```text
https://YOUR-HOST/Module.js
```

---

# Option 1: Cloudflare Workers static assets

Use Cloudflare when:

- you need a free/easy static host;
- you may need a Worker proxy for CORS;
- you want to demo an extension quickly during a workshop;
- you do not want to manage a VPS.

Cloudflare Workers can serve static assets such as HTML, CSS, JavaScript, and images, and can also run Worker code for API proxy logic.

## 1. Static-only Cloudflare deployment

Use this when the extension calls only browser-friendly APIs, for example:

- Open-Meteo weather API;
- public JSON files;
- static demo/mock data.

### Steps

1. Create or log in to Cloudflare.
2. Open:

```text
Workers & Pages
```

3. Click:

```text
Create application
```

4. Choose static assets upload / upload assets.
5. Upload a folder or ZIP with this structure:

```text
index.html
Module.js
extension.css
doc/index.html
```

6. Deploy.
7. Verify:

```text
https://YOUR-PROJECT.YOUR-SUBDOMAIN.workers.dev/
https://YOUR-PROJECT.YOUR-SUBDOMAIN.workers.dev/Module.js
https://YOUR-PROJECT.YOUR-SUBDOMAIN.workers.dev/extension.css
```

8. Register the extension in PILOT using the `Module.js` URL:

```text
https://YOUR-PROJECT.YOUR-SUBDOMAIN.workers.dev/Module.js
```

## 2. Cloudflare deployment with API Worker

Use this when:

- the browser receives CORS errors calling an external API directly;
- the API requires a server-side call;
- you need to hide or normalize API details;
- you need one public `/api` endpoint for the extension.

There are two simple layouts.

### Layout A: two Cloudflare projects

```text
extension-static
  https://weather-demo.YOUR.workers.dev/Module.js

extension-api
  https://weather-demo-api.YOUR.workers.dev/
```

Use this if you are working only through the Cloudflare UI and want the simplest manual setup.

### Layout B: one Worker with static assets + API route

```text
https://weather-demo.YOUR.workers.dev/Module.js
https://weather-demo.YOUR.workers.dev/api?...
```

Use this if you deploy with Wrangler. It is cleaner for production, but less convenient for a live workshop if participants are not using CLI tools.

## Example API Worker proxy

This is a generic CORS proxy pattern. Adapt `ALLOWED_ENDPOINTS` and `TARGET_BASE_URL` for your integration.

```js
const TARGET_BASE_URL = 'https://example.com/api';

const ALLOWED_ENDPOINTS = {
    status: true,
    schedule: true
};

export default {
    async fetch(request) {
        const url = new URL(request.url);

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, token',
            'Access-Control-Max-Age': '86400'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        const endpoint = url.searchParams.get('endpoint');

        if (!endpoint || !ALLOWED_ENDPOINTS[endpoint]) {
            return json({ error: 'Invalid endpoint' }, 400, corsHeaders);
        }

        const targetUrl = new URL(TARGET_BASE_URL + '/' + endpoint);

        for (const [key, value] of url.searchParams.entries()) {
            if (key !== 'endpoint') {
                targetUrl.searchParams.set(key, value);
            }
        }

        const response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: {
                Accept: 'application/json'
            }
        });

        const body = await response.text();

        return new Response(body, {
            status: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }
};

function json(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            ...headers,
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}
```

## Cloudflare troubleshooting

### `Module.js` gives 404

Check the uploaded structure.

If you uploaded this:

```text
weather/
  Module.js
```

then the URL is:

```text
https://YOUR-HOST/weather/Module.js
```

If you want:

```text
https://YOUR-HOST/Module.js
```

upload the contents of `weather/`, not the folder itself.

### CSS does not load

In `Module.js`, load CSS from the same directory as `Module.js`:

```js
getModuleBaseUrl: function () {
    var scripts = document.getElementsByTagName('script');

    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || '';

        if (src.indexOf('/Module.js') !== -1) {
            return src.replace('Module.js', '');
        }
    }

    return './';
}
```

Then:

```js
var href = this.getModuleBaseUrl() + 'extension.css';
```

### External API has CORS error

Use a Worker proxy. Do not call that API directly from `Module.js`.

---

# Option 2: GitHub Pages

Use GitHub Pages when:

- your extension is static only;
- there is no backend/API proxy;
- there are no secrets;
- the external API supports browser CORS;
- you want the simplest Git-based publishing workflow.

GitHub Pages can publish a site from a repository branch or from a GitHub Actions workflow. For simple static extensions, publishing from a branch is enough.

## Recommended repository layout

For one extension:

```text
my-pilot-extension/
├── index.html
├── Module.js
├── extension.css
└── doc/
    └── index.html
```

For multiple extensions in one repository:

```text
pilot-extension-host/
├── weather/
│   ├── Module.js
│   ├── weather.css
│   └── doc/
│       └── index.html
└── risk-alerts/
    ├── Module.js
    ├── risk-alerts.css
    └── doc/
        └── index.html
```

## Steps

1. Create a GitHub repository.
2. Commit extension files.
3. Open repository:

```text
Settings → Pages
```

4. Select publishing source:

```text
Deploy from a branch
```

5. Select branch:

```text
main
```

6. Select folder:

```text
/ root
```

or:

```text
/docs
```

7. Save.
8. Wait until GitHub publishes the site.
9. Verify:

```text
https://USERNAME.github.io/REPOSITORY/Module.js
```

or, for multiple extensions:

```text
https://USERNAME.github.io/REPOSITORY/weather/Module.js
```

10. Register the final `Module.js` URL in PILOT.

## GitHub Pages limitations

GitHub Pages is static hosting only.

It cannot run:

- PHP;
- server-side API proxy;
- private token handling;
- custom backend logic.

If the extension needs any of those, use Cloudflare Worker or AWS EC2.

---

# Option 3: AWS EC2 VPS with Nginx and PHP-FPM

Use AWS EC2 when:

- you need PHP backend endpoints;
- you need full Nginx control;
- you need private logs;
- you need advanced proxying;
- you need custom SSL/domain setup;
- you want to host many extensions and backends under one domain.

Example target URL:

```text
https://ext.example.com/weather/Module.js
https://ext.example.com/weather/backend/api.php
```

## Recommended server layout

```text
/var/www/pilot_extensions/
├── weather/
│   ├── Module.js
│   ├── weather.css
│   ├── doc/
│   │   └── index.html
│   └── backend/
│       └── api.php
└── risk-alerts/
    ├── Module.js
    ├── risk-alerts.css
    └── backend/
        └── api.php
```

## Basic Amazon Linux setup

Example for Amazon Linux 2023 style systems:

```bash
sudo dnf update -y

sudo dnf install -y nginx php-fpm php-cli php-json php-mbstring php-curl

sudo systemctl enable --now nginx
sudo systemctl enable --now php-fpm
```

Create application directory:

```bash
sudo mkdir -p /var/www/pilot_extensions
sudo chown -R nginx:nginx /var/www/pilot_extensions
```

## Nginx virtual host example

Create:

```text
/etc/nginx/conf.d/pilot_extensions.conf
```

Example:

```nginx
server {
    listen 80;
    server_name ext.example.com;

    root /var/www/pilot_extensions;
    index index.html;

    access_log /var/log/nginx/pilot_extensions_access.log;
    error_log  /var/log/nginx/pilot_extensions_error.log;

    # Static files:
    location / {
        try_files $uri $uri/ =404;
    }

    # PHP backend endpoints:
    location ~ \.php$ {
        try_files $uri =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;

        fastcgi_pass unix:/run/php-fpm/www.sock;
    }

    # Security: never expose hidden files:
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## PHP endpoint example

```php
<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'ok' => true,
    'time' => date('c')
]);
```

Expected URL:

```text
https://ext.example.com/weather/backend/api.php
```

## HTTPS

Use one of these:

- AWS Load Balancer + ACM certificate;
- Certbot on the instance;
- Cloudflare in front of EC2.

For public workshop/demo hosting, Cloudflare Workers or GitHub Pages is simpler. Use AWS when you need a real backend.

## AWS troubleshooting

### `Module.js` gives 404

Check file path:

```bash
ls -la /var/www/pilot_extensions/weather/Module.js
```

Check URL:

```text
https://ext.example.com/weather/Module.js
```

### PHP file downloads instead of executing

Nginx is not passing PHP to PHP-FPM. Check the `location ~ \.php$` block and `fastcgi_pass`.

### 502 Bad Gateway for PHP

Check PHP-FPM socket:

```bash
sudo systemctl status php-fpm
ls -la /run/php-fpm/
```

Update `fastcgi_pass` to the actual socket path if needed.

---

# Registering hosted extension in PILOT

After hosting is ready, use the public URL of `Module.js`.

Examples:

```text
https://weather-demo.YOUR.workers.dev/Module.js
https://USERNAME.github.io/pilot-weather/Module.js
https://ext.example.com/weather/Module.js
```

In PILOT:

```text
Admin Panel → Applications → Add
```

Use:

```text
Name: Weather Demo
URL: https://YOUR-HOST/Module.js
```

Save, enable the extension for the user, and reload PILOT.

## Browser verification

Before registering in PILOT, always open `Module.js` directly in a browser.

The browser must show JavaScript source code, not:

- 404;
- HTML error page;
- redirect loop;
- access denied;
- Cloudflare challenge page.

## PILOT verification checklist

1. `Module.js` opens directly in browser.
2. CSS file opens directly in browser.
3. No CORS errors in browser console.
4. Extension button appears in PILOT header.
5. Button click opens the extension window.
6. External API requests are visible in DevTools Network tab.
7. Extension works after full page reload.

---

# Hosting recommendations

## For workshops

Use:

```text
Cloudflare Workers static assets
```

Reason:

- no server administration;
- quick upload;
- easy demo URL;
- optional Worker proxy if CORS appears.

## For static open-source examples

Use:

```text
GitHub Pages
```

Reason:

- simple;
- versioned by Git;
- good for documentation and examples.

## For production integrations with PHP

Use:

```text
AWS EC2 + Nginx + PHP-FPM
```

Reason:

- full backend control;
- logs;
- custom routing;
- API keys can be kept server-side;
- suitable for private integrations.

---

# AI prompt addition

When asking AI to create a PILOT Extension, include hosting requirements explicitly:

```text
Deployment target:
- static files only;
- upload folder root must contain index.html, Module.js, extension.css, doc/index.html;
- final entry URL must be https://HOST/Module.js;
- provide Cloudflare upload instructions;
- provide GitHub Pages instructions if backend is not needed;
- provide AWS EC2 + Nginx + PHP-FPM instructions if backend/PHP is needed.
```

This prevents AI from generating code that cannot be uploaded or registered easily.

---

# References

- Cloudflare Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Amazon Linux 2023 web/PHP tutorial: https://docs.aws.amazon.com/linux/al2023/ug/ec2-lamp-amazon-linux-2023.html
