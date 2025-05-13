import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  HStack,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  Switch,
} from '@chakra-ui/react';
import { FiPlus, FiSave, FiTrash2, FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { Server, Config } from '../types';

const Configuration = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editedConfig, setEditedConfig] = useState<Config | null>(null);

  // Fetch configuration
  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ['config'],
    queryFn: apiClient.getConfig,
  });

  // Set edited config when data loads
  useEffect(() => {
    if (config && !editedConfig) {
      setEditedConfig(config);
    }
  }, [config, editedConfig]);

  const handleAddServer = () => {
    if (!editedConfig) return;
    
    const newServer: Server = {
      name: `server-${editedConfig.servers.length + 1}`,
      apiAddress: 'http://localhost:8080',
      destinationAddress: 'http://localhost',
      entryPoints: { 'http': 'http' }
    };
    
    setEditedConfig({
      ...editedConfig,
      servers: [...editedConfig.servers, newServer]
    });
    
    toast({
      title: 'Server added',
      description: 'New server has been added to the configuration',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleRemoveServer = (index: number) => {
    if (!editedConfig) return;
    
    const updatedServers = [...editedConfig.servers];
    updatedServers.splice(index, 1);
    
    setEditedConfig({
      ...editedConfig,
      servers: updatedServers
    });
    
    toast({
      title: 'Server removed',
      description: 'Server has been removed from the configuration',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleServerChange = (index: number, field: keyof Server, value: any) => {
    if (!editedConfig) return;
    
    const updatedServers = [...editedConfig.servers];
    updatedServers[index] = {
      ...updatedServers[index],
      [field]: value
    };
    
    setEditedConfig({
      ...editedConfig,
      servers: updatedServers
    });
  };

  const handleEntryPointChange = (serverIndex: number, mainEP: string, localEP: string) => {
    if (!editedConfig) return;
    
    const updatedServers = [...editedConfig.servers];
    updatedServers[serverIndex] = {
      ...updatedServers[serverIndex],
      entryPoints: {
        ...updatedServers[serverIndex].entryPoints,
        [mainEP]: localEP
      }
    };
    
    setEditedConfig({
      ...editedConfig,
      servers: updatedServers
    });
  };

  const handleAddEntryPoint = (serverIndex: number) => {
    if (!editedConfig) return;
    
    const updatedServers = [...editedConfig.servers];
    const server = updatedServers[serverIndex];
    
    const newMainEP = `entrypoint-${Object.keys(server.entryPoints).length + 1}`;
    const newLocalEP = `local-${Object.keys(server.entryPoints).length + 1}`;
    
    updatedServers[serverIndex] = {
      ...server,
      entryPoints: {
        ...server.entryPoints,
        [newMainEP]: newLocalEP
      }
    };
    
    setEditedConfig({
      ...editedConfig,
      servers: updatedServers
    });
  };

  const handleRemoveEntryPoint = (serverIndex: number, mainEP: string) => {
    if (!editedConfig) return;
    
    const updatedServers = [...editedConfig.servers];
    const server = updatedServers[serverIndex];
    
    const updatedEntryPoints = { ...server.entryPoints };
    delete updatedEntryPoints[mainEP];
    
    updatedServers[serverIndex] = {
      ...server,
      entryPoints: updatedEntryPoints
    };
    
    setEditedConfig({
      ...editedConfig,
      servers: updatedServers
    });
  };

  const handleGlobalChange = (field: string, value: any) => {
    if (!editedConfig) return;
    
    setEditedConfig({
      ...editedConfig,
      [field]: value
    });
  };

  const handleSaveConfig = async () => {
    if (!editedConfig) return;
    
    setIsSaving(true);
    try {
      // In a real implementation, this would call the API to update the config
      // await apiClient.updateConfig(editedConfig);
      
      // For now, we'll just show a success message
      toast({
        title: 'Configuration saved',
        description: 'Your changes have been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        
        // Basic validation
        if (!imported.servers || !Array.isArray(imported.servers)) {
          throw new Error('Invalid configuration format');
        }
        
        setEditedConfig(imported);
        
        toast({
          title: 'Configuration imported',
          description: `Imported ${imported.servers.length} servers`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error importing configuration',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleExportConfig = () => {
    if (!editedConfig) return;
    
    setIsExporting(true);
    try {
      const configString = JSON.stringify(editedConfig, null, 2);
      const blob = new Blob([configString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'traefik-relay-config.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Configuration exported',
        description: 'Your configuration has been exported as JSON',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error exporting configuration',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box p={4}>
        <Heading size="md" mb={4} color="red.500">Error loading configuration</Heading>
        <Text mb={4}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Button onClick={() => refetch()} leftIcon={<FiRefreshCw />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={6}>
        <Heading size="lg" mb={2}>Configuration</Heading>
        <Text color="gray.600">Manage your TraefikRelay configuration</Text>
      </Box>

      <HStack spacing={4} mb={6}>
        <Button
          leftIcon={<FiSave />}
          colorScheme="blue"
          onClick={handleSaveConfig}
          isLoading={isSaving}
          loadingText="Saving"
        >
          Save Configuration
        </Button>
        <Button
          leftIcon={<FiDownload />}
          onClick={handleExportConfig}
          isLoading={isExporting}
          loadingText="Exporting"
        >
          Export as JSON
        </Button>
        <Button
          leftIcon={<FiUpload />}
          onClick={() => fileInputRef.current?.click()}
        >
          Import
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportConfig}
            accept=".json"
            style={{ display: 'none' }}
          />
        </Button>
      </HStack>

      <Alert status="warning" mb={6}>
        <AlertIcon />
        <Text>
          Note: Changes to the configuration will require a restart of the TraefikRelay service to take effect.
        </Text>
      </Alert>

      {editedConfig && (
        <Box>
          <Box mb={6} p={4} bg="gray.50" borderRadius="md">
            <Heading size="md" mb={4}>Global Settings</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <FormControl>
                <FormLabel>Run Every (seconds)</FormLabel>
                <Input
                  type="number"
                  value={editedConfig.runEvery}
                  onChange={(e) => handleGlobalChange('runEvery', parseInt(e.target.value))}
                  min={1}
                />
                <FormHelperText>How often to check for changes (in seconds)</FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Forward Middlewares</FormLabel>
                <Switch
                  isChecked={editedConfig.forwardMiddlewares}
                  onChange={(e) => handleGlobalChange('forwardMiddlewares', e.target.checked)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Forward Services</FormLabel>
                <Switch
                  isChecked={editedConfig.forwardServices}
                  onChange={(e) => handleGlobalChange('forwardServices', e.target.checked)}
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          <Heading size="md" mb={4}>
            Servers ({editedConfig.servers.length})
          </Heading>
          
          <Button
            leftIcon={<FiPlus />}
            onClick={handleAddServer}
            mb={4}
            colorScheme="green"
          >
            Add Server
          </Button>

          <Accordion allowMultiple defaultIndex={[0]} mb={6}>
            {editedConfig.servers.map((server: Server, index: number) => (
              <AccordionItem key={index}>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      {server.name}
                    </Box>
                    <Badge colorScheme="blue" mr={2}>
                      {Object.keys(server.entryPoints).length} EntryPoints
                    </Badge>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Server Name</FormLabel>
                        <Input
                          value={server.name}
                          onChange={(e) => handleServerChange(index, 'name', e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>API Address</FormLabel>
                        <Input
                          value={server.apiAddress}
                          onChange={(e) => handleServerChange(index, 'apiAddress', e.target.value)}
                          placeholder="http://192.168.0.10:8080"
                        />
                        <FormHelperText>The URL of the Traefik API</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>API Host</FormLabel>
                        <Input
                          value={server.apiHost || ''}
                          onChange={(e) => handleServerChange(index, 'apiHost', e.target.value)}
                          placeholder="traefik.internal.domain"
                        />
                        <FormHelperText>Optional host header for API requests</FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Destination Address</FormLabel>
                        <Input
                          value={server.destinationAddress}
                          onChange={(e) => handleServerChange(index, 'destinationAddress', e.target.value)}
                          placeholder="http://192.168.0.10"
                        />
                        <FormHelperText>Where traffic should be directed</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Forward Middlewares</FormLabel>
                        <Switch
                          isChecked={server.forwardMiddlewares ?? editedConfig.forwardMiddlewares}
                          onChange={(e) => handleServerChange(index, 'forwardMiddlewares', e.target.checked)}
                        />
                        <FormHelperText>Override global middleware forwarding</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Forward Services</FormLabel>
                        <Switch
                          isChecked={server.forwardServices ?? editedConfig.forwardServices}
                          onChange={(e) => handleServerChange(index, 'forwardServices', e.target.checked)}
                        />
                        <FormHelperText>Override global service forwarding</FormHelperText>
                      </FormControl>
                    </SimpleGrid>

                    <Divider my={2} />

                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Heading size="sm">EntryPoints Mapping</Heading>
                        <Button
                          size="sm"
                          leftIcon={<FiPlus />}
                          onClick={() => handleAddEntryPoint(index)}
                        >
                          Add EntryPoint
                        </Button>
                      </HStack>

                      {Object.entries(server.entryPoints).map(([mainEP, localEP]) => (
                        <HStack key={mainEP} mb={2}>
                          <FormControl>
                            <FormLabel fontSize="sm">Main EntryPoint</FormLabel>
                            <Input
                              size="sm"
                              value={mainEP}
                              onChange={(e) => {
                                const oldValue = mainEP;
                                const newValue = e.target.value;
                                const localValue = server.entryPoints[oldValue];
                                
                                const updatedEntryPoints = { ...server.entryPoints };
                                delete updatedEntryPoints[oldValue];
                                updatedEntryPoints[newValue] = localValue;
                                
                                handleServerChange(index, 'entryPoints', updatedEntryPoints);
                              }}
                            />
                          </FormControl>
                          <Box pt={8}>→</Box>
                          <FormControl>
                            <FormLabel fontSize="sm">Local EntryPoint</FormLabel>
                            <Input
                              size="sm"
                              value={localEP as string}
                              onChange={(e) => handleEntryPointChange(index, mainEP, e.target.value)}
                            />
                          </FormControl>
                          <IconButton
                            aria-label="Remove entry point"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemoveEntryPoint(index, mainEP)}
                            mt={8}
                          />
                        </HStack>
                      ))}
                    </Box>

                    <Box textAlign="right" mt={4}>
                      <Button
                        colorScheme="red"
                        leftIcon={<FiTrash2 />}
                        onClick={() => handleRemoveServer(index)}
                        size="sm"
                      >
                        Remove Server
                      </Button>
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>

          <Box mb={6}>
            <Heading size="md" mb={2}>Configuration Preview</Heading>
            <Box
              p={4}
              bg="gray.900"
              color="white"
              borderRadius="md"
              maxH="400px"
              overflowY="auto"
              fontFamily="monospace"
            >
              <pre>{JSON.stringify(editedConfig, null, 2)}</pre>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Configuration;