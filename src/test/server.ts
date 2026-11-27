import { onTestFinished, vi } from 'vitest';
import { config } from '@/config';

export interface SentRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

type Handler = (request: SentRequest) => Response | Promise<Response>;

export const json = (data: unknown, status = 200): Response =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const page = <T>(results: T[]) => ({ count: results.length, next: null, previous: null, results });

export const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const toUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const readBody = (body: BodyInit | null | undefined): unknown => {
  if (typeof body !== 'string') return body ?? null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export const mockServer = () => {
  const handlers = new Map<string, Handler>();
  const requests: SentRequest[] = [];
  const unexpected: string[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const href = toUrl(input);
    const method = (init.method ?? 'GET').toUpperCase();
    if (!href.startsWith(`${config.api.baseUrl}/`)) {
      unexpected.push(`${method} ${href}`);
      throw new TypeError('Failed to fetch');
    }
    const url = new URL(href);
    const path = url.pathname.slice(new URL(config.api.baseUrl).pathname.length);
    const request: SentRequest = { method, path, query: url.searchParams, body: readBody(init.body) };
    requests.push(request);
    const handler = handlers.get(`${method} ${path}`);
    if (!handler) {
      unexpected.push(`${method} ${path}`);
      throw new TypeError('Failed to fetch');
    }
    return handler(request);
  });

  vi.stubGlobal('fetch', fetchMock);
  onTestFinished(() => {
    if (unexpected.length) throw new Error(`Неожиданные запросы к серверу: ${unexpected.join(', ')}`);
  });

  return {
    on(method: string, path: string, handler: Handler) {
      handlers.set(`${method} ${path}`, handler);
      return this;
    },
    sent(method: string, path: string) {
      return requests.filter((request) => request.method === method && request.path === path);
    },
  };
};
