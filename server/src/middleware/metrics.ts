import { Request, Response, NextFunction } from 'express';

// Simple in-memory Prometheus Metrics Counter
let totalRequests = 0;
let activeSockets = 0;

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  totalRequests++;
  next();
};

export const getPrometheusMetrics = (req: Request, res: Response) => {
  const metrics = `
# HELP http_requests_total Total number of HTTP requests processed
# TYPE http_requests_total counter
http_requests_total ${totalRequests}

# HELP active_socket_connections Current active WebRTC socket connections
# TYPE active_socket_connections gauge
active_socket_connections ${activeSockets}
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(metrics.trim());
};
