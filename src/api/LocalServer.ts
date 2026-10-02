import { RequestHandler } from './RequestHandler';

export interface ServerOptions {
  port: number;
  handler: RequestHandler;
}

export interface ServerHandle {
  close: () => Promise<void>;
  port: number;
}

/**
 * خادم HTTP بسيط باستخدام وحدة http الأصلية (بدون Express)
 * — يعمل على Termux وفي Node بدون تبعيات خارجية.
 */
export async function startLocalServer(opts: ServerOptions): Promise<ServerHandle> {
  const http = await import('http');

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      let body: any = undefined;
      if (raw) {
        try { body = JSON.parse(raw); } catch { body = { raw }; }
      }

      const url = req.url ?? '/';
      const path = url.split('?')[0];
      const method = (req.method ?? 'GET') as 'GET' | 'POST';

      const apiResp = opts.handler.handle({ method, path, body });

      res.writeHead(apiResp.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(apiResp.body, null, 2));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(opts.port, () => resolve());
  });

  return {
    port: opts.port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
