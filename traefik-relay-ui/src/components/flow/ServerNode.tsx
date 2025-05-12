import { useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';

const ServerNode = ({ data }) => {
  const getBg = useCallback(() => {
    if (data.isMain) return useColorModeValue('blue.50', 'blue.900');
    return data.status === 'online' 
      ? useColorModeValue('green.50', 'green.900') 
      : useColorModeValue('red.50', 'red.900');
  }, [data.status, data.isMain]);

  const getBorderColor = useCallback(() => {
    if (data.isMain) return useColorModeValue('blue.400', 'blue.600');
    return data.status === 'online' 
      ? useColorModeValue('green.400', 'green.600') 
      : useColorModeValue('red.400', 'red.600');
  }, [data.status, data.isMain]);

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        padding="10px"
        borderRadius="md"
        bg={getBg()}
        borderWidth="2px"
        borderColor={getBorderColor()}
        width="180px"
      >
        <Text fontWeight="bold" textAlign="center">
          {data.isMain ? 'Main Traefik' : data.label}
        </Text>
        {!data.isMain && (
          <Badge
            colorScheme={data.status === 'online' ? 'green' : 'red'}
            width="100%"
            textAlign="center"
            mt={1}
          >
            {data.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
        )}
        {data.server && data.status === 'online' && (
          <Box mt={2} fontSize="xs">
            <Text><Badge colorScheme="cyan">{data.server.httpRouters}</Badge> HTTP Routers</Text>
            <Text><Badge colorScheme="orange">{data.server.tcpRouters}</Badge> TCP Routers</Text>
          </Box>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

export default memo(ServerNode);