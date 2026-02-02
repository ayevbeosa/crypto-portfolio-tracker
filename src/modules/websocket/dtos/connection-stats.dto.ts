export class ConnectionStatsDto {
  totalConnections: number;
  authenticatedConnections: number;
  subscriptions: Record<string, number>;
}
