import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  HStack,
  Checkbox,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

// Custom node types
import ServerNode from '../components/flow/ServerNode';
import RouterNode from '../components/flow/RouterNode';
import ServiceNode from '../components/flow/ServiceNode';
import MiddlewareNode from '../components/flow/MiddlewareNode';

const nodeTypes = {
  server: ServerNode,
  router: RouterNode,
  service: ServiceNode,
  middleware: MiddlewareNode,
};

const NetworkView = () => {
  const toast = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showHttpRouters, setShowHttpRouters] = useState(true);
  const [showTcpRouters, setShowTcpRouters] = useState(true);
  const [showMiddlewares, setShowMiddlewares] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch status and config
  const statusQuery = useQuery({
    queryKey: ['status'],
    queryFn: apiClient.getStatus,
  });

  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: apiClient.getConfig,
  });

  // Fetch detailed information for all servers
  const serverDetailsQuery = useQuery({
    queryKey: ['allServerDetails'],
    queryFn: async () => {
      if (!statusQuery.data) return [];
      
      const servers = Object.keys(statusQuery.data.servers);
      const details = await Promise.all(
        servers.map(async (serverName) => {
          try {
            return await apiClient.getServerDetail(serverName);
          } catch (error) {
            console.error(`Error fetching details for ${serverName}:`, error);
            return null;
          }
        })
      );
      
      return details.filter(Boolean);
    },
    enabled: !!statusQuery.data,
  });

  // Build graph data when all queries are complete
  const graphData = useMemo(() => {
    if (!statusQuery.data || !configQuery.data || !serverDetailsQuery.data) {
      return { nodes: [], edges: [] };
    }
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, string>(); // Map to track node IDs
    
    // Create a main Traefik node
    const mainNodeId = 'main-traefik';
    nodes.push({
      id: mainNodeId,
      type: 'server',
      data: { 
        label: 'Main Traefik', 
        isMain: true,
        status: 'online',
      },
      position: { x: 400, y: 50 },
    });
    
    // Calculate positions for server nodes
    const serverCount = serverDetailsQuery.data.length;
    const radius = 300;
    const angleStep = (2 * Math.PI) / serverCount;
    
    // Add server nodes
    serverDetailsQuery.data.forEach((serverDetail, index) => {
      const angle = angleStep * index;
      const x = 400 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);
      
      const serverId = `server-${serverDetail.configuration.name}`;
      nodeMap.set(serverDetail.configuration.name, serverId);
      
      nodes.push({
        id: serverId,
        type: 'server',
        data: { 
          server: serverDetail,
          label: serverDetail.configuration.name,
          status: serverDetail.online ? 'online' : 'offline',
        },
        position: { x, y },
      });
      
      // Connect main Traefik to server
      edges.push({
        id: `edge-main-to-${serverId}`,
        source: mainNodeId,
        target: serverId,
        animated: true,
        style: { stroke: '#1890ff' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
      
      // Skip if server is offline
      if (!serverDetail.online) return;
      
      // Calculate positions for child nodes of this server
      const childAngleStep = Math.PI / 2;
      const childRadius = 150;
      
      // Filter nodes according to toggles
      const httpRouters = showHttpRouters ? serverDetail.httpRouterDetails : [];
      const tcpRouters = showTcpRouters ? serverDetail.tcpRouterDetails : [];
      const middlewares = showMiddlewares ? serverDetail.middlewareDetails : [];
      
      // Add HTTP router nodes
      httpRouters.forEach((router, rIndex) => {
        const childAngle = angle - Math.PI / 4 + (childAngleStep * rIndex / httpRouters.length);
        const routerId = `router-http-${serverDetail.configuration.name}-${router.name}`;
        
        nodes.push({
          id: routerId,
          type: 'router',
          data: { 
            router,
            server: serverDetail.configuration.name,
            type: 'http', 
          },
          position: { 
            x: x + childRadius * Math.cos(childAngle), 
            y: y + childRadius * Math.sin(childAngle) 
          },
        });
        
        // Connect server to router
        edges.push({
          id: `edge-${serverId}-to-${routerId}`,
          source: serverId,
          target: routerId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      });
      
      // Add TCP router nodes
      tcpRouters.forEach((router, rIndex) => {
        const childAngle = angle + Math.PI / 4 - (childAngleStep * rIndex / tcpRouters.length);
        const routerId = `router-tcp-${serverDetail.configuration.name}-${router.name}`;
        
        nodes.push({
          id: routerId,
          type: 'router',
          data: { 
            router,
            server: serverDetail.configuration.name,
            type: 'tcp', 
          },
          position: { 
            x: x + childRadius * Math.cos(childAngle), 
            y: y + childRadius * Math.sin(childAngle) 
          },
        });
        
        // Connect server to router
        edges.push({
          id: `edge-${serverId}-to-${routerId}`,
          source: serverId,
          target: routerId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      });
      
      // Add middleware nodes if enabled
      if (showMiddlewares) {
        middlewares.forEach((middleware, mIndex) => {
          const childAngle = angle + Math.PI / 2 - (childAngleStep * mIndex / middlewares.length);
          const middlewareId = `middleware-${serverDetail.configuration.name}-${middleware.name}`;
          
          nodes.push({
            id: middlewareId,
            type: 'middleware',
            data: { 
              middleware,
              server: serverDetail.configuration.name,
            },
            position: { 
              x: x + childRadius * Math.cos(childAngle), 
              y: y + childRadius * Math.sin(childAngle) 
            },
          });
          
          // Connect relevant routers to middleware
          if (middleware.usedBy && middleware.usedBy.length > 0) {
            middleware.usedBy.forEach(router => {
              const httpRouterId = `router-http-${serverDetail.configuration.name}-${router}`;
              
              // Check if the router exists in our nodes
              if (nodes.some(n => n.id === httpRouterId)) {
                edges.push({
                  id: `edge-${httpRouterId}-to-${middlewareId}`,
                  source: httpRouterId,
                  target: middlewareId,
                  animated: true,
                  style: { stroke: '#805AD5' },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                  },
                });
              }
            });
          }
        });
      }
    });
    
    // Add edges between main Traefik and router nodes for direct connections
    serverDetailsQuery.data.forEach(serverDetail => {
      if (!serverDetail.online) return;
      
      // Look for HTTP routers that are mapped to the main Traefik
      serverDetail.httpRouterDetails.forEach(router => {
        const routerId = `router-http-${serverDetail.configuration.name}-${router.name}`;
        
        // Check if any of the entry points are mapped to the main instance
        const mappedEntryPoints = router.entryPoints.filter(ep => 
          Object.values(serverDetail.configuration.entryPoints).includes(ep)
        );
        
        if (mappedEntryPoints.length > 0) {
          edges.push({
            id: `edge-main-to-${routerId}`,
            source: mainNodeId,
            target: routerId,
            animated: true,
            labelBgStyle: { fill: '#FFFFFF', opacity: 0.7 },
            style: { stroke: '#38A169' },
          });
        }
      });
      
      // Look for TCP routers that are mapped to the main Traefik
      serverDetail.tcpRouterDetails.forEach(router => {
        const routerId = `router-tcp-${serverDetail.configuration.name}-${router.name}`;
        
        // Check if any of the entry points are mapped to the main instance
        const mappedEntryPoints = router.entryPoints.filter(ep => 
          Object.values(serverDetail.configuration.entryPoints).includes(ep)
        );
        
        if (mappedEntryPoints.length > 0) {
          edges.push({
            id: `edge-main-to-${routerId}`,
            source: mainNodeId,
            target: routerId,
            animated: true,
            labelBgStyle: { fill: '#FFFFFF', opacity: 0.7 },
            style: { stroke: '#DD6B20' },
          });
        }
      });
    });
    
    return { nodes, edges };
  }, [statusQuery.data, configQuery.data, serverDetailsQuery.data, showHttpRouters, showTcpRouters, showMiddlewares]);
  
  // Update flow nodes and edges when graphData changes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      statusQuery.refetch();
      serverDetailsQuery.refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusQuery, serverDetailsQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        statusQuery.refetch(),
        configQuery.refetch(),
        serverDetailsQuery.refetch(),
      ]);
      
      toast({
        title: 'Network view refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error refreshing network view',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [statusQuery, configQuery, serverDetailsQuery, toast]);

  const isLoading = statusQuery.isLoading || configQuery.isLoading || serverDetailsQuery.isLoading;
  const error = statusQuery.error || configQuery.error || serverDetailsQuery.error;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Text>
            Error loading network data: {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </Alert>
        <Button leftIcon={<FiRefreshCw />} onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 100px)">
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Heading size="lg">Network Topology</Heading>
          <Text color="gray.600">Visual map of your Traefik instances and routing</Text>
        </Box>
        <Button 
          leftIcon={<FiRefreshCw />} 
          colorScheme="blue" 
          onClick={handleRefresh}
          isLoading={isRefreshing}
        >
          Refresh
        </Button>
      </Flex>

      <Box
        height="100%"
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
          <Panel position="top-left">
            <Box bg="white" p={3} borderRadius="md" shadow="md">
              <Heading size="sm" mb={2}>Legend</Heading>
              <HStack mb={2}>
                <Badge colorScheme="blue" p={1}>Main Traefik</Badge>
                <Badge colorScheme="green" p={1}>Server Online</Badge>
                <Badge colorScheme="red" p={1}>Server Offline</Badge>
              </HStack>
              <HStack>
                <Badge colorScheme="orange" p={1}>TCP Router</Badge>
                <Badge colorScheme="cyan" p={1}>HTTP Router</Badge>
                <Badge colorScheme="purple" p={1}>Middleware</Badge>
              </HStack>
            </Box>
          </Panel>
          <Panel position="top-right">
            <Box bg="white" p={3} borderRadius="md" shadow="md">
              <Heading size="sm" mb={2}>Display Options</Heading>
              <Checkbox
                isChecked={showHttpRouters}
                onChange={(e) => setShowHttpRouters(e.target.checked)}
                mb={1}
              >
                Show HTTP Routers
              </Checkbox>
              <Checkbox
                isChecked={showTcpRouters}
                onChange={(e) => setShowTcpRouters(e.target.checked)}
                mb={1}
              >
                Show TCP Routers
              </Checkbox>
              <Checkbox
                isChecked={showMiddlewares}
                onChange={(e) => setShowMiddlewares(e.target.checked)}
              >
                Show Middlewares
              </Checkbox>
            </Box>
          </Panel>
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default NetworkView;