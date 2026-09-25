import { wsUrl } from "./config";

type Handler = (event: WsEvent) => void;

export type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(wsUrl());
    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as WsEvent;
        this.handlers.forEach((h) => h(data));
      } catch {
        /* ignore */
      }
    };
    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload }));
  }
}

export const wsClient = new WebSocketClient();
