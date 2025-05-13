import { useEffect } from 'react';
import { Box, SimpleGrid, Heading, Text, Card, CardHeader, CardBody, Badge, Flex, Button, useToast } from '@chakra-ui/react';
import { FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from '../utils/dateUtils';

const Dashboard = () => {
  const toast = useToast();

  // Fetch status
  const { data: statusInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['status'],
    queryFn: apiClient.getStatus
  });

  // Refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefreshAll = () => {
    refetch();
    toast({
      title: 'Refreshing all servers',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleRefreshServer = async (serverName: string) => {
    try {
      await apiClient.refreshServer(serverName);
      await refetch();
      toast({
        title: `Server ${serverName} refreshed`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error refreshing server',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box p={4}>
        <Heading size="md" mb={4} color="red.500">Error loading status</Heading>
        <Text>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Button mt={4} onClick={() => refetch()} leftIcon={<FiRefreshCw />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={1}>Traefik Instances Dashboard</Heading>
          <Text color="gray.600">
            Last updated: {statusInfo && formatDistanceToNow(new Date(statusInfo.lastUpdated))}
          </Text>
        </Box>
        <Button onClick={handleRefreshAll} leftIcon={<FiRefreshCw />} colorScheme="blue">
          Refresh All
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {statusInfo && Object.entries(statusInfo.servers).map(([serverName, server]) => (
          <Card 
            key={serverName} 
            shadow="md" 
            borderRadius="lg" 
            transition="all 0.3s" 
            _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
            borderTop="4px solid"
            borderTopColor={server.online ? 'green.400' : 'red.400'}
          >
            <CardHeader pb={0}>
              <Flex justify="space-between" align="center">
                <Heading size="md">{serverName}</Heading>
                <Badge colorScheme={server.online ? 'green' : 'red'}>
                  {server.online ? 'Online' : 'Offline'}
                </Badge>
              </Flex>
            </CardHeader>

            <CardBody>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Last checked: {formatDistanceToNow(new Date(server.lastChecked))}
              </Text>

              {server.online ? (
                <SimpleGrid columns={2} spacing={3} mb={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">HTTP Routers</Text>
                    <Text fontSize="xl">{server.httpRouters}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">TCP Routers</Text>
                    <Text fontSize="xl">{server.tcpRouters}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">Middlewares</Text>
                    <Text fontSize="xl">{server.middlewares}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">Services</Text>
                    <Text fontSize="xl">{server.services}</Text>
                  </Box>
                </SimpleGrid>
              ) : (
                <Box mb={4} p={3} bg="red.50" borderRadius="md">
                  <Text color="red.600">{server.error || 'Server is offline'}</Text>
                </Box>
              )}

              <Flex justify="space-between">
                <Button 
                  size="sm" 
                  leftIcon={<FiRefreshCw />} 
                  onClick={() => handleRefreshServer(serverName)}
                  isDisabled={isLoading}
                >
                  Refresh
                </Button>
                <Button 
                  as={RouterLink}
                  to={`/servers/${serverName}`}
                  size="sm" 
                  rightIcon={<FiArrowRight />}
                  colorScheme="blue"
                  variant="outline"
                >
                  Details
                </Button>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;