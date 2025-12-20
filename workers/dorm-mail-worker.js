/**
 * Cloudflare Worker - Dorm Mail Proxy
 * Features:
 * 1. Fetches dorm mail data from NCNU legacy system (Big5 encoding)
 * 2. Parses HTML using Regex (since DOMParser/BeautifulSoup isn't available)
 * 3. Returns JSON data with CORS headers
 * 4. Implements short-term caching (5 minutes)
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        // Only allow GET requests
        if (request.method !== "GET") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        // Cache key based on the request URL (ignoring query params for the upstream fetch)
        const cacheUrl = new URL(request.url);
        const cacheKey = new Request(cacheUrl.toString(), request);
        const cache = caches.default;

        // Try to find the response in cache
        let response = await cache.match(cacheKey);

        if (!response) {
            console.log("Cache miss, fetching from NCNU...");

            try {
                // Fetch from NCNU Dorm Mail System
                const targetUrl = "https://ccweb.ncnu.edu.tw/dormmail/Default.asp";
                const upstreamResponse = await fetch(targetUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; NCNU-Super-Assistant/1.0)",
                    },
                });

                // The response is likely Big5. Cloudflare Workers TextDecoder supports 'big5'
                const arrayBuffer = await upstreamResponse.arrayBuffer();
                const decoder = new TextDecoder("big5");
                const text = decoder.decode(arrayBuffer);

                // Parse HTML
                const mailList = parseDormMailHtml(text);

                // Create JSON response
                response = new Response(JSON.stringify({
                    success: true,
                    data: mailList,
                    count: mailList.length,
                    cached_at: new Date().toISOString()
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        // Cache for 5 minutes (300 seconds)
                        "Cache-Control": "public, max-age=300",
                    },
                });

                // Store in cache
                ctx.waitUntil(cache.put(cacheKey, response.clone()));

            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: "Failed to fetch or parse upstream data: " + error.message
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    }
                });
            }
        } else {
            console.log("Cache hit!");
        }

        return response;
    },
};

/**
 * Parse HTML content using Regex
 * NCNU format: 　編號　日期　收件人　郵寄公司　種類　追蹤號碼　系所　天數　
 */
function parseDormMailHtml(html) {
    const mailList = [];

    // Extract body content roughly
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) return [];

    const bodyText = bodyMatch[1].replace(/<[^>]*>/g, ""); // Remove tags

    // Split by fullwidth space (U+3000)
    const parts = bodyText.split('\u3000')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    let i = 0;
    while (i < parts.length) {
        const part = parts[i];

        // Look for date pattern (YYYY/MM/DD)
        if (part.includes('/') && /20\d{2}\/\d{1,2}\/\d{1,2}/.test(part)) {
            // Must have enough following parts
            if (i > 0 && i + 6 < parts.length) {
                try {
                    const item = {
                        id: parts[i - 1],
                        arrival_time: part,
                        recipient: parts[i + 1],
                        carrier: parts[i + 2],
                        type: parts[i + 3],
                        tracking_number: parts[i + 4],
                        department: parts[i + 5],
                        days_since_arrival: parts[i + 6]
                    };

                    // Basic validation
                    if (item.recipient && item.id) {
                        mailList.push(item);
                    }
                    i += 7; // Skip processed fields
                    continue;
                } catch (e) {
                    // Ignore parsing error
                }
            }
        }
        i++;
    }

    return mailList;
}
