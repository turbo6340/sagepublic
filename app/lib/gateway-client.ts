import WebSocket from 'ws';
import * as crypto from 'crypto';

const WS_URL = process.env.GATEWAY_WS_URL!;
const TOKEN = process.env.GATEWAY_TOKEN!;

export async function sendChat(text: string): Promise&lt;string&gt; {
  const params = {
    sessionKey: 'agent:main:main',
    message: text,
  };
  const result = await gatewayCall('agent', params);
  return result;
}

export async function getHealth(): Promise&lt;any&gt; {
  return gatewayCall('health', {});
}

async function gatewayCall(method: string, params: Record&lt;string, any&gt;): Promise&lt;any&gt; {
  return new Promise((resolve, reject) =&gt; {
    const ws = new WebSocket(WS_URL);
    const reqId = crypto.randomUUID();
    const isAgent = method === 'agent';
    let connectDone = false;
    const responses: any[] = [];
    const timeout = setTimeout(() =&gt; {
      ws.terminate();
      reject(new Error('Request timeout'));
    }, 120 * 1000);
    const messageHandler = (data: WebSocket.RawData) =&gt; {
      try {
        const msg = JSON.parse(data.toString()) as any;
        if (msg.type === 'event' &amp;&amp; msg.event === 'connect.challenge') {
          handleChallenge(msg.payload, ws).catch(reject);
          return;
        }
        if (msg.type === 'res' &amp;&amp; msg.id === reqId) {
          responses.push(msg.payload);
          const status = msg.payload?.status;
          if (status === 'ok' || (!isAgent &amp;&amp; msg.ok)) {
            ws.off('message', messageHandler as any);
            clearTimeout(timeout);
            ws.close();
            const payload = isAgent ? msg.payload.summary : msg.payload;
            resolve(payload);
            return;
          } else if (status === 'error') {
            ws.off('message', messageHandler as any);
            clearTimeout(timeout);
            ws.close();
            reject(new Error(msg.payload.summary || msg.error?.message || 'Unknown error'));
            return;
          }
          // accepted or other, continue
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.on('message', messageHandler);
    ws.on('error', reject);
    ws.on('close', () =&gt; {
      if (!connectDone) {
        reject(new Error('Connection closed before request'));
      }
    });
    async function handleChallenge(challenge: any, ws: WebSocket) {
      try {
        const keypair = await crypto.subtle.generateKey(
          { name: 'Ed25519' },
          true,
          ['sign']
        );
        const pubRaw = await crypto.subtle.exportKey('raw', keypair.publicKey) as ArrayBuffer;
        const pubB64 = Buffer.from(pubRaw).toString('base64');
        const nonceBytes = new TextEncoder().encode(challenge.nonce);
        const sigRaw = await crypto.subtle.sign('Ed25519', nonceBytes, keypair.privateKey!) as ArrayBuffer;
        const sigB64 = Buffer.from(sigRaw).toString('base64');
        const deviceId = `artificialexpert-${crypto.createHash('sha256').update(pubB64).digest('hex').slice(0,12)}`;
        const connectId = crypto.randomUUID();
        const connectParams = {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'artificialexpert-app',
            version: '1.0.0',
            platform: 'nextjs-fly',
            mode: 'operator'
          },
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          caps: [],
          commands: [],
          permissions: {},
          auth: { token: TOKEN },
          locale: 'en-US',
          userAgent: 'ArtificialExpertApp/1.0.0',
          device: {
            id: deviceId,
            publicKey: pubB64,
            signature: sigB64,
            signedAt: Date.now(),
            nonce: challenge.nonce
          }
        };
        const connectMsg = {
          type: 'req' as const,
          id: connectId,
          method: 'connect',
          params: connectParams
        };
        ws.send(JSON.stringify(connectMsg));
        // wait connect res
        const connectResPromise = new Promise((r) =&gt; {
          const h = (data: WebSocket.RawData) =&gt; {
            const msg = JSON.parse(data.toString()) as any;
            if (msg.type === 'res' &amp;&amp; msg.id === connectId) {
              ws.off('message', h as any);
              r(msg);
            }
          };
          ws.on('message', h);
        });
        const connectRes = await connectResPromise as any;
        if (!connectRes.ok) {
          throw new Error(`Connect failed: ${connectRes.error?.message}`);
        }
        connectDone = true;
        // send req
        const fullParams = {
          ...params,
          idempotencyKey: crypto.randomUUID()
        };
        const reqMsg = {
          type: 'req' as const,
          id: reqId,
          method,
          params: fullParams
        };
        ws.send(JSON.stringify(reqMsg));
      } catch (e) {
        reject(e);
      }
    }
    // timeout for challenge
    setTimeout(() =&gt; {
      if (!connectDone) {
        reject(new Error('No connect challenge received'));
      }
    }, 10000);
  });
}
