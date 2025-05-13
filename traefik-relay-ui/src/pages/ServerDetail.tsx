import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  SimpleGrid,
  Badge,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Tag,
  TagLabel,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from '../utils/dateUtils';

const ServerDetail = () => {
  const { serverName } = useParams<{ serverName: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch server details
  const { data: serverDetail, isLoading, error, refetch } = useQuery({
    queryKey: ['serverDetail', serverName],
    queryFn: () => serverName ? apiClient.getServerDetail(serverName) : Promise.reject('No server name provided'),
    enabled: !!serverName,
  });

  const handleRefresh = useCallback(async () => {
    if (!serverName) return;
    
    setIsRefreshing(true);
    try {
      await apiClient.refreshServer(serverName);
      await refetch();
      toast({
        title: 'Server refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to refresh server',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [serverName, refetch, toast]);

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !serverDetail) {
    return (
      <Box p={4}>
        <Button leftIcon={<FiArrowLeft />} onClick={goBack} mb={4}>
          Back
        </Button>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Error loading server details</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Unknown error'}</AlertDescription>
        </Alert>
        <Button mt={4} onClick={() => refetch()} leftIcon={<FiRefreshCw />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <HStack mb={6} spacing={4}>
        <Button leftIcon={<FiArrowLeft />} onClick={goBack}>
          Back
        </Button>
        <Button 
          leftIcon={<FiRefreshCw />} 
          colorScheme="blue" 
          onClick={handleRefresh} 
          isLoading={isRefreshing}
          loadingText="Refreshing"
        >
          Refresh
        </Button>
      </HStack>

      <Box mb={6}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg">{serverName}</Heading>
            <Text color="gray.600" mt={1}>
              Last checked: {formatDistanceToNow(new Date(serverDetail.lastChecked))}
            </Text>
          </Box>
          <Badge 
            fontSize="md" 
            colorScheme={serverDetail.online ? 'green' : 'red'}
            p={2}
          >
            {serverDetail.online ? 'Online' : 'Offline'}
          </Badge>
        </Flex>

        {!serverDetail.online && serverDetail.error && (
          <Alert status="error" mt={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{serverDetail.error}</AlertDescription>
          </Alert>
        )}
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Card>
          <CardHeader pb={0}>
            <Heading size="md">Server Configuration</Heading>
          </CardHeader>
          <CardBody>
            <Box>
              <Text fontWeight="bold">API Address:</Text>
              <Text>{serverDetail.configuration.apiAddress}</Text>
            </Box>
            {serverDetail.configuration.apiHost && (
              <Box mt={3}>
                <Text fontWeight="bold">API Host:</Text>
                <Text>{serverDetail.configuration.apiHost}</Text>
              </Box>
            )}
            <Box mt={3}>
              <Text fontWeight="bold">Destination Address:</Text>
              <Text>{serverDetail.configuration.destinationAddress}</Text>
            </Box>
            <Box mt={3}>
              <Text fontWeight="bold">EntryPoints Mapping:</Text>
              {Object.entries(serverDetail.configuration.entryPoints).map(([main, local]) => (
                <Flex key={main} mt={1}>
                  <Tag colorScheme="blue" mr={1}>
                    <TagLabel>{main}</TagLabel>
                  </Tag>
                  <Text mx={2}>→</Text>
                  <Tag colorScheme="green">
                    <TagLabel>{local}</TagLabel>
                  </Tag>
                </Flex>
              ))}
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <Heading size="md">Status Summary</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontWeight="bold" color="gray.600">HTTP Routers</Text>
                <Text fontSize="2xl">{serverDetail.httpRouters}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">TCP Routers</Text>
                <Text fontSize="2xl">{serverDetail.tcpRouters}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Middlewares</Text>
                <Text fontSize="2xl">{serverDetail.middlewares}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Services</Text>
                <Text fontSize="2xl">{serverDetail.services}</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>HTTP Routers</Tab>
          <Tab>TCP Routers</Tab>
          <Tab>Middlewares</Tab>
          <Tab>Services</Tab>
        </TabList>

        <TabPanels>
          {/* HTTP Routers Tab */}
          <TabPanel>
            {serverDetail.httpRouterDetails && serverDetail.httpRouterDetails.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Rule</Th>
                      <Th>EntryPoints</Th>
                      <Th>Service</Th>
                      <Th>Middlewares</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serverDetail.httpRouterDetails.map(router => (
                      <Tr key={router.name}>
                        <Td fontWeight="medium">{router.name}</Td>
                        <Td fontSize="sm" maxW="300px" whiteSpace="normal">{router.rule}</Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {router.entryPoints.map(ep => (
                              <Tag size="sm" key={ep} colorScheme="blue" mt={1}>
                                {ep}
                              </Tag>
                            ))}
                          </HStack>
                        </Td>
                        <Td>{router.service}</Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {router.middlewares.map(mw => (
                              <Tag size="sm" key={mw} colorScheme="purple" mt={1}>
                                {mw}
                              </Tag>
                            ))}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text>No HTTP routers found</Text>
              </Box>
            )}
          </TabPanel>

          {/* TCP Routers Tab */}
          <TabPanel>
            {serverDetail.tcpRouterDetails && serverDetail.tcpRouterDetails.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Rule</Th>
                      <Th>EntryPoints</Th>
                      <Th>Service</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serverDetail.tcpRouterDetails.map(router => (
                      <Tr key={router.name}>
                        <Td fontWeight="medium">{router.name}</Td>
                        <Td fontSize="sm" maxW="300px" whiteSpace="normal">{router.rule}</Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {router.entryPoints.map(ep => (
                              <Tag size="sm" key={ep} colorScheme="blue" mt={1}>
                                {ep}
                              </Tag>
                            ))}
                          </HStack>
                        </Td>
                        <Td>{router.service}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text>No TCP routers found</Text>
              </Box>
            )}
          </TabPanel>

          {/* Middlewares Tab */}
          <TabPanel>
            {serverDetail.middlewareDetails && serverDetail.middlewareDetails.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Provider</Th>
                      <Th>Status</Th>
                      <Th>Used By</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serverDetail.middlewareDetails.map(middleware => (
                      <Tr key={middleware.name}>
                        <Td fontWeight="medium">{middleware.name}</Td>
                        <Td>{middleware.provider}</Td>
                        <Td>
                          <Badge colorScheme={middleware.status === 'enabled' ? 'green' : 'yellow'}>
                            {middleware.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            {middleware.usedBy && middleware.usedBy.length > 0 ? (
                              middleware.usedBy.map(user => (
                                <Tag size="sm" key={user} colorScheme="teal" mt={1}>
                                  {user}
                                </Tag>
                              ))
                            ) : (
                              <Text fontSize="sm" color="gray.500">Not used</Text>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text>No middlewares found</Text>
              </Box>
            )}
          </TabPanel>

          {/* Services Tab */}
          <TabPanel>
            {serverDetail.serviceDetails && serverDetail.serviceDetails.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Provider</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serverDetail.serviceDetails.map(service => (
                      <Tr key={service.name}>
                        <Td fontWeight="medium">{service.name}</Td>
                        <Td>{service.provider}</Td>
                        <Td>
                          <Badge colorScheme={service.status === 'enabled' ? 'green' : 'yellow'}>
                            {service.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text>No services found</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ServerDetail;