export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  detail?: string;
}
