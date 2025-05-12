export interface Server {
    name: string;
    apiAddress: string;
    apiHost?: string;
    destinationAddress: string;
    forwardMiddlewares?: boolean;
    forwardServices?: boolean;
    entryPoints: Record<string, string>;
  }
  
  export interface Config {
    servers: Server[];
    runEvery: number;
    forwardMiddlewares: boolean;
    forwardServices: boolean;
  }
  
  export interface ServerStatus {
    online: boolean;
    lastChecked: string;
    httpRouters: number;
    tcpRouters: number;
    middlewares: number;
    services: number;
    error?: string;
    configuration: Server;
  }
  
  export interface StatusInfo {
    lastUpdated: string;
    servers: Record<string, ServerStatus>;
  }
  
  export interface HttpRouter {
    entryPoints: string[];
    middlewares: string[];
    service: string;
    rule: string;
    name: string;
    priority: number;
    status: string;
    provider: string;
  }
  
  export interface TcpRouter {
    entryPoints: string[];
    service: string;
    rule: string;
    name: string;
    priority: number;
    status: string;
    provider: string;
  }
  
  export interface Middleware {
    status: string;
    usedBy: string[];
    name: string;
    provider: string;
  }
  
  export interface Service {
    name: string;
    provider: string;
    status: string;
  }
  
  export interface DetailedServerStatus extends ServerStatus {
    httpRouterDetails: HttpRouter[];
    tcpRouterDetails: TcpRouter[];
    middlewareDetails: Middleware[];
    serviceDetails: Service[];
  }
  
  export interface ServerNode {
    id: string;
    type: 'server';
    data: {
      server: ServerStatus;
    };
    position: { x: number; y: number };
  }
  
  export interface ServiceNode {
    id: string;
    type: 'service';
    data: {
      service: string;
      server: string;
    };
    position: { x: number; y: number };
  }
  
  export interface RouterNode {
    id: string;
    type: 'router';
    data: {
      router: HttpRouter | TcpRouter;
      server: string;
      type: 'http' | 'tcp';
    };
    position: { x: number; y: number };
  }
  
  export interface MiddlewareNode {
    id: string;
    type: 'middleware';
    data: {
      middleware: Middleware;
      server: string;
    };
    position: { x: number; y: number };
  }
  
  export type Node = ServerNode | ServiceNode | RouterNode | MiddlewareNode;
  
  export interface Edge {
    id: string;
    source: string;
    target: string;
    type?: string;
    label?: string;
    animated?: boolean;
  }
  
  export interface GraphData {
    nodes: Node[];
    edges: Edge[];
  }