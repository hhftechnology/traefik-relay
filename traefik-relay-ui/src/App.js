import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Server, BarChart2, Database, Settings, ChevronRight, Save, Plus, Trash, Edit, X } from 'lucide-react';

// API service to communicate with the backend
const apiService = {
  baseUrl: '', // Empty string for relative URLs in the same domain
  
  async fetchStatus() {
    const response = await fetch(`${this.baseUrl}/api/v1/status`);
    if (!response.ok) {
      throw new Error(`Status request failed: ${response.status}`);
    }
    return response.json();
  },
  
  async fetchServers() {
    const response = await fetch(`${this.baseUrl}/api/v1/servers`);
    if (!response.ok) {
      throw new Error(`Servers request failed: ${response.status}`);
    }
    return response.json();
  },
  
  async fetchServerDetail(serverName) {
    const response = await fetch(`${this.baseUrl}/api/v1/servers/${serverName}`);
    if (!response.ok) {
      throw new Error(`Server detail request failed for ${serverName}: ${response.status}`);
    }
    return response.json();
  },
  
  async refreshServer(serverName) {
    const response = await fetch(`${this.baseUrl}/api/v1/servers/${serverName}/refresh`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(`Server refresh failed for ${serverName}: ${response.status}`);
    }
    return response.json();
  },
  
  async fetchConfig() {
    const response = await fetch(`${this.baseUrl}/api/v1/config`);
    if (!response.ok) {
      throw new Error(`Config request failed: ${response.status}`);
    }
    return response.json();
  },
  
  async updateConfig(config) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Config update failed: ${response.status}`
        );
      }
      
      return response.json();
    } catch (error) {
      console.error("Error updating config:", error);
      throw error;
    }
  },
  
  async fetchRedisKeys() {
    const response = await fetch(`${this.baseUrl}/api/v1/redis/keys`);
    if (!response.ok) {
      throw new Error(`Redis keys request failed: ${response.status}`);
    }
    return response.json();
  },
  
  async flushRedis() {
    const response = await fetch(`${this.baseUrl}/api/v1/redis/flush`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(`Redis flush failed: ${response.status}`);
    }
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

// Redux Management Component
const RedisManagement = ({ onFlushRedis }) => {
  const [redisKeys, setRedisKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchRedisKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const keys = await apiService.fetchRedisKeys();
      setRedisKeys(keys);
    } catch (error) {
      console.error("Error fetching Redis keys:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRedisKeys();
  }, []);
  
  const handleFlushRedis = async () => {
    if (window.confirm("Are you sure you want to flush Redis database? This will remove all keys.")) {
      setLoading(true);
      try {
        await apiService.flushRedis();
        await fetchRedisKeys(); // Refresh keys after flush
      } catch (error) {
        console.error("Error flushing Redis:", error);
        setError(error.message);
      } finally {
        setLoading(false);
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
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button 
            onClick={handleFlushRedis} 
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={loading}
          >
            <Database size={16} />
            Flush Redis
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium">Redis Keys</h3>
          <p className="text-sm text-gray-500">Total: {redisKeys.length} keys</p>
        </div>
        <div className="p-6">
          {loading && redisKeys.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-blue-600 mr-2" size={24} />
              <p>Loading Redis keys...</p>
            </div>
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
            <p className="text-gray-500 py-4">No Redis keys found</p>
          )}
        </div>
      </div>
    </div>
  );
};

// EntryPointRow component for adding/editing entry points
const EntryPointRow = ({ mainEntryPoint, localEntryPoint, onUpdate, onRemove, isNew = false }) => {
  const [main, setMain] = useState(mainEntryPoint);
  const [local, setLocal] = useState(localEntryPoint);
  
  return (
    <div className="flex items-center gap-2 mb-2">
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Main EntryPoint"
        value={main}
        onChange={(e) => setMain(e.target.value)}
      />
      <span className="text-gray-500">→</span>
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Local EntryPoint"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      {isNew ? (
        <button
          onClick={() => onUpdate(main, local)}
          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={!main || !local}
        >
          <Plus size={16} />
        </button>
      ) : (
        <>
          <button
            onClick={() => onUpdate(main, local)}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onRemove}
            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Trash size={16} />
          </button>
        </>
      )}
    </div>
  );
};

// ServerConfigForm component for editing a server configuration
const ServerConfigForm = ({ server, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: server?.name || '',
    apiAddress: server?.apiAddress || '',
    apiHost: server?.apiHost || '',
    destinationAddress: server?.destinationAddress || '',
    entryPoints: { ...(server?.entryPoints || { "web": "web" }) },
    forwardMiddlewares: server?.forwardMiddlewares === undefined ? null : server.forwardMiddlewares,
    forwardServices: server?.forwardServices === undefined ? null : server.forwardServices
  });
  
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleAddEntryPoint = (main, local) => {
    if (main && local) {
      setFormData(prev => ({
        ...prev,
        entryPoints: {
          ...prev.entryPoints,
          [main]: local
        }
      }));
      setIsAdding(false);
    }
  };
  
  const handleUpdateEntryPoint = (oldMain, newMain, newLocal) => {
    if (newMain && newLocal) {
      // Create a new object without the old key
      const updatedEntryPoints = { ...formData.entryPoints };
      delete updatedEntryPoints[oldMain];
      
      setFormData(prev => ({
        ...prev,
        entryPoints: {
          ...updatedEntryPoints,
          [newMain]: newLocal
        }
      }));
    }
  };
  
  const handleRemoveEntryPoint = (main) => {
    const updatedEntryPoints = { ...formData.entryPoints };
    delete updatedEntryPoints[main];
    
    setFormData(prev => ({
      ...prev,
      entryPoints: updatedEntryPoints
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Server name is required";
    }
    
    if (!formData.apiAddress.trim()) {
      newErrors.apiAddress = "API address is required";
    } else if (!formData.apiAddress.startsWith('http://') && !formData.apiAddress.startsWith('https://')) {
      newErrors.apiAddress = "API address must start with http:// or https://";
    }
    
    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = "Destination address is required";
    } else if (!formData.destinationAddress.startsWith('http://') && !formData.destinationAddress.startsWith('https://')) {
      newErrors.destinationAddress = "Destination address must start with http:// or https://";
    }
    
    if (Object.keys(formData.entryPoints).length === 0) {
      newErrors.entryPoints = "At least one entry point is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
        <input
          type="text"
          id="name"
          name="name"
          className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., compute-1"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      
      <div className="mb-4">
        <label htmlFor="apiAddress" className="block text-sm font-medium text-gray-700 mb-1">API Address</label>
        <input
          type="text"
          id="apiAddress"
          name="apiAddress"
          className={`w-full p-2 border rounded ${errors.apiAddress ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.apiAddress}
          onChange={handleInputChange}
          placeholder="e.g., http://192.168.0.10:8080"
        />
        {errors.apiAddress && <p className="mt-1 text-sm text-red-600">{errors.apiAddress}</p>}
      </div>
      
      <div className="mb-4">
        <label htmlFor="apiHost" className="block text-sm font-medium text-gray-700 mb-1">API Host (Optional)</label>
        <input
          type="text"
          id="apiHost"
          name="apiHost"
          className="w-full p-2 border border-gray-300 rounded"
          value={formData.apiHost}
          onChange={handleInputChange}
          placeholder="e.g., traefik.internal.domain"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
        <input
          type="text"
          id="destinationAddress"
          name="destinationAddress"
          className={`w-full p-2 border rounded ${errors.destinationAddress ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.destinationAddress}
          onChange={handleInputChange}
          placeholder="e.g., http://192.168.0.10"
        />
        {errors.destinationAddress && <p className="mt-1 text-sm text-red-600">{errors.destinationAddress}</p>}
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Entry Points Mapping</label>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} className="mr-1" /> Add Entry Point
          </button>
        </div>
        
        {errors.entryPoints && <p className="mb-2 text-sm text-red-600">{errors.entryPoints}</p>}
        
        <div className="border rounded p-3 bg-gray-50">
          {Object.entries(formData.entryPoints).map(([main, local]) => (
            <EntryPointRow
              key={main}
              mainEntryPoint={main}
              localEntryPoint={local}
              onUpdate={(newMain, newLocal) => handleUpdateEntryPoint(main, newMain, newLocal)}
              onRemove={() => handleRemoveEntryPoint(main)}
            />
          ))}
          
          {isAdding && (
            <EntryPointRow
              mainEntryPoint=""
              localEntryPoint=""
              onUpdate={handleAddEntryPoint}
              onRemove={() => setIsAdding(false)}
              isNew={true}
            />
          )}
          
          {Object.keys(formData.entryPoints).length === 0 && !isAdding && (
            <p className="text-gray-500 text-sm py-2">No entry points defined. Click "Add Entry Point" to add one.</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Maps the main Traefik instance entry points (left) to local Traefik instance entry points (right).
        </p>
      </div>
      
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="forwardMiddlewares"
              className="mr-2 h-4 w-4"
              checked={formData.forwardMiddlewares === true}
              onChange={handleCheckboxChange}
            />
            <span className="text-sm font-medium text-gray-700">Forward Middlewares</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Override global setting for this server. If unchecked, uses global setting.
          </p>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="forwardServices"
              className="mr-2 h-4 w-4"
              checked={formData.forwardServices === true}
              onChange={handleCheckboxChange}
            />
            <span className="text-sm font-medium text-gray-700">Forward Services</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Override global setting for this server. If unchecked, uses global setting.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Server
        </button>
      </div>
    </form>
  );
};

// Enhanced Configuration Component
const Configuration = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [editServerIndex, setEditServerIndex] = useState(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
// In the Configuration component
useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        console.log("Fetching config...");
        const response = await fetch(`${apiService.baseUrl}/api/v1/config`);
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Config received:", data);
        setConfig(data || {});
      } catch (error) {
        console.error("Error fetching configuration:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchConfig();
  }, []);
  
  const handleEditConfig = () => {
    // Create a deep copy of the config to edit
    setEditedConfig(JSON.parse(JSON.stringify(config)));
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedConfig(null);
    setEditServerIndex(null);
    setShowAddServer(false);
    setSaveStatus(null);
  };
  
  const handleSaveConfig = async () => {
    setLoading(true);
    setSaveStatus({ type: 'info', message: 'Saving configuration...' });
    try {
      await apiService.updateConfig(editedConfig);
      setConfig(editedConfig);
      setEditMode(false);
      setEditedConfig(null);
      setSaveStatus({ type: 'success', message: 'Configuration saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving configuration:", error);
      setSaveStatus({ 
        type: 'error', 
        message: `Failed to save configuration: ${
          error.response?.data?.message || error.message || 'Unknown error'
        }`
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditServer = (index) => {
    setEditServerIndex(index);
  };
  
  const handleAddServer = () => {
    setShowAddServer(true);
  };
  
  const handleSaveServer = (serverData) => {
    if (editServerIndex !== null) {
      // Update existing server
      const updatedServers = [...editedConfig.servers];
      updatedServers[editServerIndex] = serverData;
      setEditedConfig({
        ...editedConfig,
        servers: updatedServers
      });
      setEditServerIndex(null);
    } else if (showAddServer) {
      // Add new server
      setEditedConfig({
        ...editedConfig,
        servers: [...editedConfig.servers, serverData]
      });
      setShowAddServer(false);
    }
  };
  
  const handleDeleteServer = (index) => {
    if (window.confirm("Are you sure you want to delete this server? This cannot be undone.")) {
      const updatedServers = [...editedConfig.servers];
      updatedServers.splice(index, 1);
      setEditedConfig({
        ...editedConfig,
        servers: updatedServers
      });
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    }));
  };
  
  if (loading && !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-blue-600 mr-2" size={24} />
        <p>Loading configuration...</p>
      </div>
    );
  }
  
  if (error && !config) {
    return (
      <div className="p-8 bg-red-100 text-red-800 rounded">
        <h3 className="font-bold mb-2">Error Loading Configuration</h3>
        <p>{error}</p>
        <button 
          onClick={fetchConfig}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // If we're editing a server or adding a new one
  if (editMode && (editServerIndex !== null || showAddServer)) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            onClick={() => {
              setEditServerIndex(null);
              setShowAddServer(false);
            }} 
            className="mr-4 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Config
          </button>
          <h2 className="text-2xl font-bold">
            {editServerIndex !== null ? 'Edit Server' : 'Add New Server'}
          </h2>
        </div>
        
        <ServerConfigForm 
          server={editServerIndex !== null ? editedConfig.servers[editServerIndex] : null}
          onSave={handleSaveServer}
          onCancel={() => {
            setEditServerIndex(null);
            setShowAddServer(false);
          }}
        />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Configuration</h2>
        <div className="flex gap-3">
          {!editMode ? (
            <>
              <button 
                onClick={fetchConfig} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button 
                onClick={handleEditConfig} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Edit size={16} />
                Edit Configuration
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleCancelEdit} 
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <X size={16} />
                Cancel
              </button>
              <button 
                onClick={handleSaveConfig} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading}
              >
                <Save size={16} />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
      
      {saveStatus && (
        <div className={`mb-6 p-4 rounded ${
          saveStatus.type === 'error' ? 'bg-red-100 text-red-800' : 
          saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          <p>{saveStatus.message}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          {editMode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Run Every (seconds)</label>
              <input
                type="number"
                name="runEvery"
                min="5"
                className="w-full p-2 border border-gray-300 rounded"
                value={editedConfig.runEvery}
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">Run Every</p>
              <p className="text-xl font-semibold">{config?.runEvery || 'N/A'} seconds</p>
            </>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          {editMode ? (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="forwardMiddlewares"
                  className="mr-2 h-4 w-4"
                  checked={editedConfig.forwardMiddlewares}
                  onChange={handleInputChange}
                />
                <span className="text-sm font-medium text-gray-700">Forward Middlewares</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Global setting for all servers unless overridden
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">Forward Middlewares</p>
              <p className="text-xl font-semibold">{config?.forwardMiddlewares ? "Yes" : "No"}</p>
            </>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          {editMode ? (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="forwardServices"
                  className="mr-2 h-4 w-4"
                  checked={editedConfig.forwardServices}
                  onChange={handleInputChange}
                />
                <span className="text-sm font-medium text-gray-700">Forward Services</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Global setting for all servers unless overridden
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">Forward Services</p>
              <p className="text-xl font-semibold">{config?.forwardServices ? "Yes" : "No"}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium">Servers Configuration</h3>
          {editMode && (
            <button
              onClick={handleAddServer}
              className="flex items-center text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Plus size={16} className="mr-1" /> Add Server
            </button>
          )}
        </div>
        <div className="p-6">
          {(config?.servers || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Host</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EntryPoints</th>
                    {editMode && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(editMode ? editedConfig.servers : config.servers).map((server, index) => (
                    <tr key={`${server.name}-${index}`}>
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
                      {editMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditServer(index)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteServer(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-4">No servers configured</p>
          )}
        </div>
      </div>
      
      {/* Configuration Notes & Help */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Configuration Guide</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800">Global Settings</h4>
            <p className="text-gray-600">
              <strong>Run Every:</strong> Interval in seconds between Traefik configuration checks.
            </p>
            <p className="text-gray-600">
              <strong>Forward Middlewares:</strong> Forward middleware references from local to main Traefik instance.
            </p>
            <p className="text-gray-600">
              <strong>Forward Services:</strong> Forward service references from local to main Traefik instance.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">Server Configuration</h4>
            <p className="text-gray-600">
              <strong>API Address:</strong> URL to the Traefik API (e.g., http://192.168.0.10:8080)
            </p>
            <p className="text-gray-600">
              <strong>API Host:</strong> Optional custom host header for API requests
            </p>
            <p className="text-gray-600">
              <strong>Destination Address:</strong> URL where traffic should be directed
            </p>
            <p className="text-gray-600">
              <strong>Entry Points:</strong> Mapping between main Traefik and local Traefik entry points
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">Entry Points Mapping</h4>
            <p className="text-gray-600">
              The entry points mapping connects entry points on your main Traefik instance to those on the local instance.
            </p>
            <p className="text-gray-600">
              For example: <code>web → local-http</code> maps main 'web' to local 'local-http'.
            </p>
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
  const [error, setError] = useState(null);
  
  // Fetch initial data
  useEffect(() => {
    fetchStatus();
  }, []);
  
  // Fetch status data
  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusData = await apiService.fetchStatus();
      setStatus(statusData);
      setServers(statusData.servers || {});
    } catch (error) {
      console.error("Error fetching status:", error);
      setError(`Failed to load status: ${error.message}`);
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
      alert(`Failed to fetch server details: ${error.message}`);
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
      alert(`Failed to refresh server: ${error.message}`);
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
  
  // Render error state
  if (error && !status) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-lg shadow">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
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