import { useState, useEffect } from 'react';

export interface RealTimeEvent {
  type: 'automation_run_update' | 'webhook_delivery_update' | 'api_usage_update' | 'connection_ack' | 'authenticated' | 'subscribed' | 'error' | 'pong';
  data?: any;
  message?: string;
  user_id?: string;
  events?: string[];
  timestamp?: string;
}

export class YusrAIRealTime {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(token: string, baseUrl: string = 'https://zorwtyijosgdcckljmqd.supabase.co') {
    this.token = token;
    this.url = `${baseUrl.replace('https://', 'wss://')}/functions/v1/realtime-events`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('YusrAI Real-time connected');
          this.reconnectAttempts = 0;
          
          // Authenticate immediately
          this.send({
            type: 'authenticate',
            token: this.token
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealTimeEvent = JSON.parse(event.data);
            
            if (message.type === 'authenticated') {
              resolve();
            } else if (message.type === 'error') {
              reject(new Error(message.message));
            }

            // Trigger event handlers
            const handlers = this.eventHandlers.get(message.type) || [];
            handlers.forEach(handler => handler(message));
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('YusrAI Real-time disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('YusrAI Real-time error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(events: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.send({
      type: 'subscribe',
      events
    });
  }

  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler?: Function): void {
    if (!handler) {
      this.eventHandlers.delete(eventType);
    } else {
      const handlers = this.eventHandlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  ping(): void {
    this.send({ type: 'ping' });
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }
}

// Helper hook for React components
export const useYusrAIRealTime = (token: string) => {
  const [realTime, setRealTime] = useState<YusrAIRealTime | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const rt = new YusrAIRealTime(token);
    
    rt.on('connection_ack', () => setConnected(true));
    rt.on('error', () => setConnected(false));
    
    rt.connect()
      .then(() => {
        setRealTime(rt);
        setConnected(true);
      })
      .catch(error => {
        console.error('Failed to connect to real-time:', error);
        setConnected(false);
      });

    return () => {
      rt.disconnect();
      setConnected(false);
    };
  }, [token]);

  return { realTime, connected };
};
