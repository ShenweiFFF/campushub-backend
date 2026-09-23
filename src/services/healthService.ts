export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}

export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    service: 'campushub-backend',
    timestamp: new Date().toISOString(),
  };
}
