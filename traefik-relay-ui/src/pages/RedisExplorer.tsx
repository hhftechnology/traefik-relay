import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  Badge,
  Tooltip,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FiRefreshCw, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from '../utils/dateUtils';

const RedisExplorer = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);

  // Fetch Redis keys
  const { data: redisKeys, isLoading, error, refetch } = useQuery({
    queryKey: ['redisKeys'],
    queryFn: apiClient.getRedisKeys,
  });

  // Fetch status to show last updated time
  const { data: statusInfo } = useQuery({
    queryKey: ['status'],
    queryFn: apiClient.getStatus,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Redis keys refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error refreshing Redis keys',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFlushRedis = async () => {
    setIsFlushing(true);
    try {
      await apiClient.flushRedis();
      await refetch();
      toast({
        title: 'Redis database flushed',
        description: 'All keys have been removed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error flushing Redis',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFlushing(false);
    }
  };

  // Group and count Redis keys by server and type
  const keyStatistics = (keys: string[] = []) => {
    const statistics: Record<string, Record<string, number>> = {};
    
    keys.forEach(key => {
      const parts = key.split('/');
      if (parts.length >= 4) {
        const [_, type, category, server] = parts;
        
        if (!statistics[server]) {
          statistics[server] = {};
        }
        
        const statKey = `${type}/${category}`;
        statistics[server][statKey] = (statistics[server][statKey] || 0) + 1;
      }
    });
    
    return statistics;
  };

  const stats = keyStatistics(redisKeys);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box p={4}>
        <Heading size="md" mb={4} color="red.500">Error loading Redis keys</Heading>
        <Text mb={4}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Button onClick={handleRefresh} leftIcon={<FiRefreshCw />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Redis Explorer</Heading>
          <Text color="gray.600">
            {statusInfo ? `Last updated: ${formatDistanceToNow(new Date(statusInfo.lastUpdated))}` : 'Manage and view Redis keys'}
          </Text>
        </Box>
        <HStack spacing={4}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            loadingText="Refreshing"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiAlertTriangle />}
            colorScheme="red"
            onClick={onOpen}
          >
            Flush Redis
          </Button>
        </HStack>
      </Flex>

      <Box mb={8}>
        <Heading size="md" mb={4}>Key Statistics</Heading>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Server</Th>
                <Th>HTTP Routers</Th>
                <Th>HTTP Services</Th>
                <Th>TCP Routers</Th>
                <Th>TCP Services</Th>
                <Th>Total Keys</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(stats).map(([server, categories]) => {
                const httpRouters = categories['http/routers'] || 0;
                const httpServices = categories['http/services'] || 0;
                const tcpRouters = categories['tcp/routers'] || 0;
                const tcpServices = categories['tcp/services'] || 0;
                const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
                
                return (
                  <Tr key={server}>
                    <Td fontWeight="medium">{server}</Td>
                    <Td>
                      <Badge colorScheme="blue">{httpRouters}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="teal">{httpServices}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="orange">{tcpRouters}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple">{tcpServices}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="gray">{total}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Box mb={6}>
        <HStack mb={4}>
          <Heading size="md">Redis Keys</Heading>
          <Tooltip label="These keys are used by Traefik's Redis provider to configure routing">
            <Box>
              <Icon as={FiInfo} color="gray.500" />
            </Box>
          </Tooltip>
        </HStack>
        {redisKeys && redisKeys.length > 0 ? (
          <Box maxH="600px" overflowY="auto" borderWidth="1px" borderRadius="md" p={3}>
            <VStack align="stretch" spacing={1}>
              {redisKeys.map(key => (
                <Text key={key} fontSize="sm" fontFamily="monospace" py={1}>
                  {key}
                </Text>
              ))}
            </VStack>
          </Box>
        ) : (
          <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text textAlign="center">No Redis keys found</Text>
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog for Redis Flush */}
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={undefined}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.500">
              Flush Redis Database
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4}>
                Are you sure you want to flush the Redis database? This will remove ALL keys and require a full refresh of the configuration.
              </Text>
              <Text fontWeight="bold">This action cannot be undone.</Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={undefined} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleFlushRedis} 
                ml={3}
                isLoading={isFlushing}
                loadingText="Flushing"
              >
                Flush Redis
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default RedisExplorer;