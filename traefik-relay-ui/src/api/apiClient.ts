import axios from 'axios';
import { 
  Config, 
  DetailedServerStatus, 
  ServerStatus, 
  StatusInfo 
} from '../types';

// Base API URL - normally we'd handle this with environment variables
const API_BASE_URL = '/api/v1';

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client methods
export const apiClient = {
  // Status endpoints
  getStatus: async (): Promise<StatusInfo> => {
    const response = await api.get<StatusInfo>('/status');
    return response.data;
  },

  // Server endpoints
  getServers: async (): Promise<Record<string, ServerStatus>> => {
    const response = await api.get<Record<string, ServerStatus>>('/servers');
    return response.data;
  },

  getServerDetail: async (serverName: string): Promise<DetailedServerStatus> => {
    const response = await api.get<DetailedServerStatus>(`/servers/${serverName}`);
    return response.data;
  },

  refreshServer: async (serverName: string): Promise<{ status: string; message?: string }> => {
    const response = await api.post<{ status: string; message?: string }>(`/servers/${serverName}/refresh`);
    return response.data;
  },

  // Config endpoints
  getConfig: async (): Promise<Config> => {
    const response = await api.get<Config>('/config');
    return response.data;
  },

  updateConfig: async (config: Config): Promise<void> => {
    await api.put('/config', config);
  },

  // Redis endpoints
  getRedisKeys: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/redis/keys');
    return response.data;
  },

  flushRedis: async (): Promise<{ status: string }> => {
    const response = await api.post<{ status: string }>('/redis/flush');
    return response.data;
  },
};