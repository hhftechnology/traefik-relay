import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Server, BarChart2, Database, Settings, ChevronRight } from 'lucide-react';

// API service to communicate with the backend
const apiService = {
  baseUrl: '', // Empty string for relative URLs in the same domain
  
  async fetchStatus() {
    const response = await fetch(`${this.baseUrl}/api/v1/status`);
    return response.json();
  },
  
  async fetchServers() {
    const response = await fetch(`${this.baseUrl}/api/v1/servers`);
    return response.json();
  },
  
  async fetchServerDetail(serverName) {
    const response = await fetch(`${this.baseUrl}/api/v1/servers/${serverName}`);
    return response.json();
  },
  
  async refreshServer(serverName) {
    const response = await fetch(`${this.baseUrl}/api/v1/servers/${serverName}/refresh`, {
      method: 'POST'
    });
    return response.json();
  },
  
  async fetchConfig() {
    const response = await fetch(`${this.baseUrl}/api/v1/config`);
    return response.json();
  },
  
  async fetchRedisKeys() {
    const response = await fetch(`${this.baseUrl}/api/v1/redis/keys`);
    return response.json();
  },
  
  async flushRedis() {
    const response = await fetch(`${this.baseUrl}/api/v1/redis/flush`, {
      method: 'POST'
    });
    return response.json();
  }
};

// Dashboard Component
const Dashboard = ({ servers, onRefresh, onViewDetails }) => {
  const totalServers = Object.keys(servers).length;
  const onlineServers = Object.values(servers).filter(server => server.online).length;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button 
          onClick={onRefresh} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <Server className="text-blue-500 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Servers</p>
              <p className="text-xl font-semibold">{totalServers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Online Servers</p>
              <p className="text-xl font-semibold">{onlineServers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-500">Offline Servers</p>
              <p className="text-xl font-semibold">{totalServers - onlineServers}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium">Servers</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(servers).map(([serverName, server]) => (
            <div key={serverName} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {server.online ? (
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                ) : (
                  <AlertCircle className="text-red-500 mr-3" size={20} />
                )}
                <div>
                  <h4 className="font-medium">{serverName}</h4>
                  <p className="text-sm text-gray-500">
                    Last checked: {new Date(server.lastChecked).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    HTTP: {server.httpRouters}
                  </div>
                  <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    TCP: {server.tcpRouters}
                  </div>
                </div>
                <button 
                  onClick={() => onRefresh(serverName)} 
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  onClick={() => onViewDetails(serverName)} 
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Server Detail Component
const ServerDetail = ({ serverName, serverDetail, onBack, onRefresh }) => {
  if (!serverDetail) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
          <h2 className="text-2xl font-bold">{serverName}</h2>
          {serverDetail.online ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Online</span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">Offline</span>
          )}
        </div>
        <button 
          onClick={() => onRefresh(serverName)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      
      {serverDetail.error && (
        <div className="mb-6 px-4 py-3 bg-red-100 text-red-800 rounded">
          <p className="font-medium">Error</p>
          <p>{serverDetail.error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium">HTTP Routers</h3>
          </div>
          <div className="p-6">
            {serverDetail.httpRouterDetails && serverDetail.httpRouterDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serverDetail.httpRouterDetails.map((router) => (
                      <tr key={router.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{router.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{router.rule}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{router.service}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            router.status === "enabled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {router.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No HTTP routers found</p>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium">TCP Routers</h3>
          </div>
          <div className="p-6">
            {serverDetail.tcpRouterDetails && serverDetail.tcpRouterDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serverDetail.tcpRouterDetails.map((router) => (
                      <tr key={router.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{router.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{router.rule}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{router.service}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            router.status === "enabled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {router.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No TCP routers found</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium">Middlewares</h3>
          </div>
          <div className="p-6">
            {serverDetail.middlewareDetails && serverDetail.middlewareDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serverDetail.middlewareDetails.map((middleware) => (
                      <tr key={middleware.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{middleware.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{middleware.provider}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            middleware.status === "enabled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {middleware.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No middlewares found</p>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium">Services</h3>
          </div>
          <div className="p-6">
            {serverDetail.serviceDetails && serverDetail.serviceDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serverDetail.serviceDetails.map((service) => (
                      <tr key={service.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{service.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{service.provider}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            service.status === "enabled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {service.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No services found</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium">Configuration</h3>
        </div>
        <div className="p-6">
          <h4 className="font-medium mb-2">Server Settings</h4>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">API Address</p>
              <p>{serverDetail.configuration.apiAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destination Address</p>
              <p>{serverDetail.configuration.destinationAddress}</p>
            </div>
            {serverDetail.configuration.apiHost && (
              <div>
                <p className="text-sm text-gray-500">API Host</p>
                <p>{serverDetail.configuration.apiHost}</p>
              </div>
            )}
          </div>
          
          <h4 className="font-medium mb-2">Entry Points Mapping</h4>
          {serverDetail.configuration.entryPoints && Object.keys(serverDetail.configuration.entryPoints).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Traefik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Traefik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(serverDetail.configuration.entryPoints).map(([main, local]) => (
                    <tr key={main}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{main}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No entry points defined</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Redis Management Component
const RedisManagement = ({ onFlushRedis }) => {
  const [redisKeys, setRedisKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchRedisKeys = async () => {
    setLoading(true);
    try {
      const keys = await apiService.fetchRedisKeys();
      setRedisKeys(keys);
    } catch (error) {
      console.error("Error fetching Redis keys:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRedisKeys();
  }, []);
  
  const handleFlushRedis = async () => {
    if (window.confirm("Are you sure you want to flush Redis database? This will remove all keys.")) {
      try {
        await apiService.flushRedis();
        fetchRedisKeys();
      } catch (error) {
        console.error("Error flushing Redis:", error);
      }
    }
  };
  
  // Group keys by prefix for better display
  const groupedKeys = redisKeys.reduce((acc, key) => {
    const parts = key.split('/');
    const prefix = parts.slice(0, 3).join('/');
    
    if (!acc[prefix]) {
      acc[prefix] = [];
    }
    acc[prefix].push(key);
    
    return acc;
  }, {});
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Redis Management</h2>
        <div className="flex gap-3">
          <button 
            onClick={fetchRedisKeys} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            onClick={handleFlushRedis} 
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Database size={16} />
            Flush Redis
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium">Redis Keys</h3>
          <p className="text-sm text-gray-500">Total: {redisKeys.length} keys</p>
        </div>
        <div className="p-6">
          {loading ? (
            <p>Loading Redis keys...</p>
          ) : redisKeys.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedKeys).map(([prefix, keys]) => (
                <div key={prefix} className="border rounded">
                  <div className="px-4 py-2 bg-gray-50 font-medium">{prefix}</div>
                  <div className="p-4 max-h-40 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {keys.map((key) => (
                        <li key={key} className="py-2 text-sm">{key}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No Redis keys found</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Configuration Component
const Configuration = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await apiService.fetchConfig();
      setConfig(config);
    } catch (error) {
      console.error("Error fetching configuration:", error);
      setError("Failed to load configuration: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConfig();
  }, []);
  
  if (loading) {
    return <div className="p-4">Loading configuration...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!config) {
    return <div className="p-4">No configuration data available.</div>;
  }
  
  if (!config) {
    return <p>Failed to load configuration.</p>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Configuration</h2>
        <button 
          onClick={fetchConfig} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Run Every</p>
          <p className="text-xl font-semibold">{config.runEvery} seconds</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Forward Middlewares</p>
          <p className="text-xl font-semibold">{config.forwardMiddlewares ? "Yes" : "No"}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Forward Services</p>
          <p className="text-xl font-semibold">{config.forwardServices ? "Yes" : "No"}</p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium">Servers Configuration</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Host</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EntryPoints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {config.servers.map((server) => (
                  <tr key={server.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{server.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{server.apiAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{server.destinationAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{server.apiHost || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {server.entryPoints && Object.entries(server.entryPoints).map(([main, local]) => (
                        <div key={main}>
                          <span className="font-medium">{main}</span> → {local}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [status, setStatus] = useState(null);
  const [servers, setServers] = useState({});
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverDetail, setServerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch initial data
  useEffect(() => {
    fetchStatus();
  }, []);
  
  // Fetch status data
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const statusData = await apiService.fetchStatus();
      setStatus(statusData);
      setServers(statusData.servers || {});
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch server detail
  const fetchServerDetail = async (serverName) => {
    try {
      const detail = await apiService.fetchServerDetail(serverName);
      setServerDetail(detail);
      setSelectedServer(serverName);
      setActiveView('serverDetail');
    } catch (error) {
      console.error(`Error fetching details for server ${serverName}:`, error);
    }
  };
  
  // Refresh a single server
  const refreshServer = async (serverName) => {
    try {
      await apiService.refreshServer(serverName);
      if (activeView === 'serverDetail' && selectedServer === serverName) {
        fetchServerDetail(serverName);
      }
      fetchStatus();
    } catch (error) {
      console.error(`Error refreshing server ${serverName}:`, error);
    }
  };
  
  // Render loading state
  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-lg">Loading TraefikRelay...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TraefikRelay</h1>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-gray-500">
                Last updated: {status ? new Date(status.lastUpdated).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium">Navigation</h2>
              </div>
              <div className="p-2">
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg ${
                        activeView === 'dashboard' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <BarChart2 className="mr-3" size={20} />
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveView('redis')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg ${
                        activeView === 'redis' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Database className="mr-3" size={20} />
                      Redis Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveView('config')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg ${
                        activeView === 'config' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="mr-3" size={20} />
                      Configuration
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
          
          <div className="flex-1">
            {activeView === 'dashboard' && (
              <Dashboard 
                servers={servers} 
                onRefresh={fetchStatus} 
                onViewDetails={fetchServerDetail} 
              />
            )}
            
            {activeView === 'serverDetail' && (
              <ServerDetail 
                serverName={selectedServer} 
                serverDetail={serverDetail}
                onBack={() => setActiveView('dashboard')} 
                onRefresh={refreshServer} 
              />
            )}
            
            {activeView === 'redis' && (
              <RedisManagement onFlushRedis={() => {}} />
            )}
            
            {activeView === 'config' && (
              <Configuration />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;