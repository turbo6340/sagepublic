import WebSocket from 'ws';
import * as crypto from 'crypto';

const WS_URL = process.env.GATEWAY_WS_URL!;
const TOKEN = process.env.GATEWAY_TOKEN!;

// In-memory keypair cache (stable per process lifetime)
let cachedKeypair: {
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
  publicKeyRaw: Buffer;
  deviceId: string;
} | null = null;

// Ed25519 SPKI prefix for reconstructing public key
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

async function getOrCreateKeypair() {
  if (cachedKeypair) return cachedKeypair;
  
  // Generate Ed25519 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  
  // Export raw public key (32 bytes)
  const spki = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const publicKeyRaw = spki.subarray(ED25519_SPKI_PREFIX.length);
  
  // Device ID = sha256(rawPublicKeyBytes).hex (full 64 chars)
  const deviceId = crypto.createHash('sha256').update(publicKeyRaw).digest('hex');
  
  cachedKeypair = { privateKey, publicKey, publicKeyRaw, deviceId };
  return cachedKeypair;
}

function buildDeviceAuthPayload(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string | null;
  nonce?: string;
}): string {
  const version = params.nonce ? 'v2' : 'v1';
  const scopesStr = params.scopes.join(',');
  const tokenStr = params.token ?? '';
  
  const base = [
    version,
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopesStr,
    String(params.signedAtMs),
    tokenStr,
  ];
  
  if (version === 'v2') {
    base.push(params.nonce ?? '');
  }
  
  return base.join('|');
}

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
    const reqId = crypto.randomUUID();
    const isAgent = method === 'agent';
    let connectDone = false;
    const responses: any[] = [];
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Request timeout'));
    }, 120 * 1000);
    const messageHandler = (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as any;
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          handleChallenge(msg.payload, ws).catch(reject);
          return;
        }
        if (msg.type === 'res' && msg.id === reqId) {
          responses.push(msg.payload);
          const status = msg.payload?.status;
          if (status === 'ok' || (!isAgent && msg.ok)) {
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
    ws.on('close', () => {
      if (!connectDone) {
        reject(new Error('Connection closed before request'));
      }
    });
    async function handleChallenge(challenge: any, ws: WebSocket) {
      try {
        const keys = await getOrCreateKeypair();
        const signedAtMs = Date.now();
        
        // Build payload per gateway spec
        const payload = buildDeviceAuthPayload({
          deviceId: keys.deviceId,
          clientId: 'gateway-client',
          clientMode: 'backend',
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          signedAtMs,
          token: TOKEN,
          nonce: challenge.nonce,
        });
        
        // Sign the payload (not raw nonce)
        const sigRaw = crypto.sign(null, Buffer.from(payload, 'utf8'), keys.privateKey);
        const sigB64Url = base64UrlEncode(sigRaw);
        
        // Public key as base64url of raw bytes
        const pubB64Url = base64UrlEncode(keys.publicKeyRaw);
        
        const connectId = crypto.randomUUID();
        const connectParams = {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'gateway-client',
            version: '1.0.0',
            platform: 'nextjs-fly',
            mode: 'backend'
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
            id: keys.deviceId,
            publicKey: pubB64Url,
            signature: sigB64Url,
            signedAt: signedAtMs,
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
        const connectResPromise = new Promise((r) => {
          const h = (data: WebSocket.RawData) => {
            const msg = JSON.parse(data.toString()) as any;
            if (msg.type === 'res' && msg.id === connectId) {
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
    setTimeout(() => {
      if (!connectDone) {
        reject(new Error('No connect challenge received'));
      }
    }, 10000);
  });
}
