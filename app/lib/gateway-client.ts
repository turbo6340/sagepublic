import WebSocket from 'ws';
import * as crypto from 'crypto';

const WS_URL = process.env.GATEWAY_WS_URL!;
const TOKEN = process.env.GATEWAY_TOKEN!;

// NOTE:
// We intentionally connect as a token-authenticated backend client **without device identity**.
// That avoids device pairing requirements and keeps this app simple.

export async function sendChat(text: string): Promise<string> {
  const params = {
    sessionKey: 'agent:main:main',
    message: text,
  };
  const result = await gatewayCall('agent', params);
  return result;
}

export async function getHealth(): Promise<any> {
  return gatewayCall('health', {});
}

async function gatewayCall(method: string, params: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    const connectId = crypto.randomUUID();
    const reqId = crypto.randomUUID();
    const isAgent = method === 'agent';

    let connected = false;

    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Request timeout'));
    }, 60 * 1000);

    function cleanup() {
      clearTimeout(timeout);
      try {
        ws.close();
      } catch {}
    }

    ws.on('open', () => {
      const connectParams = {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'gateway-client',
          version: '1.0.0',
          platform: 'nextjs-fly',
          mode: 'backend',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: TOKEN },
        locale: 'en-US',
        userAgent: 'ArtificialExpertApp/1.0.0',
        // no `device` field (token-only backend client; avoids pairing)
      };

      ws.send(
        JSON.stringify({
          type: 'req',
          id: connectId,
          method: 'connect',
          params: connectParams,
        })
      );
    });

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as any;

        // Ignore the pre-connect challenge event (we are not doing device auth).
        if (msg.type === 'event' && msg.event === 'connect.challenge') return;

        // Handle connect response
        if (msg.type === 'res' && msg.id === connectId) {
          if (!msg.ok) {
            cleanup();
            reject(new Error(`Connect failed: ${msg.error?.message}`));
            return;
          }
          connected = true;

          // Send request after successful connect
          const reqMsg = {
            type: 'req',
            id: reqId,
            method,
            params: {
              ...params,
              idempotencyKey: crypto.randomUUID(),
            },
          };
          ws.send(JSON.stringify(reqMsg));
          return;
        }

        // Handle method response
        if (msg.type === 'res' && msg.id === reqId) {
          if (!msg.ok) {
            cleanup();
            reject(new Error(msg.error?.message || 'Unknown error'));
            return;
          }

          // For `agent`, the useful user-facing text is in payload.summary
          const payload = isAgent ? msg.payload?.summary : msg.payload;
          cleanup();
          resolve(payload);
        }
      } catch (e) {
        cleanup();
        reject(e);
      }
    });

    ws.on('error', (err) => {
      cleanup();
      reject(err);
    });

    ws.on('close', () => {
      if (!connected) {
        cleanup();
        reject(new Error('Connection closed before connect'));
      }
    });
  });
}
