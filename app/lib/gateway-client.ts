import WebSocket from 'ws';
import * as crypto from 'crypto';

const WS_URL = process.env.GATEWAY_WS_URL!;
const TOKEN = process.env.GATEWAY_TOKEN!;

// NOTE:
// We intentionally connect as a token-authenticated backend client **without device identity**.
// That avoids device pairing requirements and keeps this app simple.

function extractAssistantText(payload: any): string {
  if (!payload) return "";

  // If gateway already returns a plain string.
  if (typeof payload === "string") return payload.trim();

  // Common places the text might live.
  if (typeof payload.text === "string") return payload.text.trim();
  if (typeof payload.message === "string") return payload.message.trim();
  if (typeof payload.outputText === "string") return payload.outputText.trim();

  // Many gateway replies include an array in `summary`.
  const summary = payload.summary ?? payload.output ?? payload.content;

  if (Array.isArray(summary)) {
    const parts = summary
      .map((p) => {
        if (!p) return "";
        if (typeof p === "string") return p;
        if (typeof p.text === "string") return p.text;
        if (typeof p.summary_text === "string") return p.summary_text;
        return "";
      })
      .filter(Boolean);

    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }

  // Nested fallbacks
  if (summary && typeof summary === "object" && !Array.isArray(summary)) {
    const nested = extractAssistantText(summary);
    if (nested) return nested;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function extractAgentResultText(agentPayload: any): string {
  // The gateway `agent` method returns a run envelope; useful text is usually in result.payloads[].text
  const p = agentPayload;
  if (!p) return "";

  // Common direct shapes
  if (typeof p === "string") return p;

  const result = p.result ?? p;
  const payloads = result?.payloads;
  if (Array.isArray(payloads) && payloads.length) {
    const texts = payloads
      .map((x: any) => (typeof x?.text === "string" ? x.text : ""))
      .filter(Boolean);
    if (texts.length) return texts.join("\n\n").trim();
  }

  // Fallbacks
  if (typeof p.summary === "string") return p.summary;
  if (typeof result?.summary === "string") return result.summary;

  return extractAssistantText(p);
}

export async function sendChat(text: string, sessionKey: string): Promise<string> {
  const params = {
    sessionKey,
    message: text,
  };
  const payload = await gatewayCall('agent', params);
  return extractAgentResultText(payload) || "(No text returned)";
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

          if (isAgent) {
            const status = msg.payload?.status;
            if (status === 'accepted') {
              // keep waiting for the final ok payload
              return;
            }
            if (status === 'error') {
              cleanup();
              reject(new Error(msg.payload?.summary || msg.error?.message || 'Agent error'));
              return;
            }
            // expected final payload has `status: ok` and `summary`
            cleanup();
            resolve(msg.payload);
            return;
          }

          cleanup();
          resolve(msg.payload);
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
