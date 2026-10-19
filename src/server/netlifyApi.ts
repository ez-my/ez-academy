import serverless from 'serverless-http';
import type { Context, HandlerResponse } from '@netlify/functions';
import { createApplication } from './application';

let application: ReturnType<typeof serverless> | undefined;

// Adapt the original Express routes to Netlify's native request runtime.
export default async function api(request: Request, context: Context) {
  try {
    application ||= serverless(createApplication(), { binary: ['audio/*', 'application/octet-stream'] });
    const url = new URL(request.url);
    const prefix = '/.netlify/functions/api';
    const path = url.pathname.startsWith(prefix) ? '/api' + url.pathname.slice(prefix.length) : url.pathname;
    const body = ['GET', 'HEAD'].includes(request.method) ? null : Buffer.from(await request.arrayBuffer()).toString('base64');
    const query: Record<string, string[]> = {};
    for (const [key, value] of url.searchParams) (query[key] ||= []).push(value);
    const result = await application({
      path, httpMethod: request.method, headers: Object.fromEntries(request.headers),
      queryStringParameters: Object.fromEntries(url.searchParams), multiValueQueryStringParameters: query,
      body, isBase64Encoded: body !== null, requestContext: {}, rawUrl: request.url, rawQuery: url.search.slice(1),
    }, context) as HandlerResponse;
    const headers = new Headers();
    for (const [key, value] of Object.entries(result.headers || {})) if (value !== undefined) headers.set(key, String(value));
    for (const [key, values] of Object.entries(result.multiValueHeaders || {})) for (const value of values || []) headers.append(key, String(value));
    const responseBody = request.method === 'HEAD' || [204, 304].includes(result.statusCode) ? null : result.isBase64Encoded ? Buffer.from(result.body || '', 'base64') : result.body || '';
    return new Response(responseBody, { status: result.statusCode, headers });
  } catch {
    return Response.json({ error: 'The server is not configured yet. Please try again later.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
