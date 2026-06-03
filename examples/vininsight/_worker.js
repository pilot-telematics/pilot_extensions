const AUTO_DEV_BASE_URL = 'https://api.auto.dev';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS
            });
        }

        if (url.pathname === '/api/health') {
            return json({
                ok: true,
                service: 'vininsight',
                supportsUserApiKeys: true
            });
        }

        const vinMatch = url.pathname.match(/^\/api\/vin\/([^/]+)$/);

        if (vinMatch) {
            return proxyVinDecode(request, env, vinMatch[1]);
        }

        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return json({error: 'Not found'}, 404);
    }
};

async function proxyVinDecode(request, env, rawVin) {
    if (request.method !== 'GET') {
        return json({error: 'Method not allowed'}, 405, {
            Allow: 'GET, OPTIONS'
        });
    }

    const apiKey = getRequestApiKey(request);

    if (!apiKey) {
        return json({
            error: 'API key is required. Add a user API key in VIN Insight before decoding a VIN.'
        }, 401);
    }

    const vin = String(rawVin || '').toUpperCase();

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        return json({
            error: 'VIN must be exactly 17 characters and cannot contain I, O, or Q'
        }, 400);
    }

    const targetUrl = `${AUTO_DEV_BASE_URL}/vin/${encodeURIComponent(vin)}`;
    const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`
        }
    });
    const body = await upstream.text();

    return new Response(body, {
        status: upstream.status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function getRequestApiKey(request) {
    const authorization = request.headers.get('Authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (match && match[1]) {
        return match[1].trim();
    }

    return '';
}

function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            ...headers,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}
