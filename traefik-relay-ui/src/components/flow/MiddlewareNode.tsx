import { useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { Middleware } from '../../types';

interface MiddlewareNodeProps {
  data: {
    middleware: Middleware;
  };
}

const MiddlewareNode = ({ data }: MiddlewareNodeProps) => {
  const getBg = useCallback(() => {
    return useColorModeValue('purple.50', 'purple.900');
  }, []);

  const getBorderColor = useCallback(() => {
    return useColorModeValue('purple.400', 'purple.600');
  }, []);

  const middleware = data.middleware;
  
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        padding="10px"
        borderRadius="md"
        bg={getBg()}
        borderWidth="2px"
        borderColor={getBorderColor()}
        width="140px"
      >
        <Badge
          colorScheme="purple"
          width="100%"
          textAlign="center"
          mb={1}
        >
          Middleware
        </Badge>
        <Text fontWeight="bold" fontSize="sm" textAlign="center">
          {middleware.name}
        </Text>
        <Text fontSize="xs" mt={1}>
          Provider: <Badge>{middleware.provider}</Badge>
        </Text>
        <Badge 
          colorScheme={middleware.status === 'enabled' ? 'green' : 'yellow'}
          size="sm"
          mt={1}
        >
          {middleware.status}
        </Badge>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

export default memo(MiddlewareNode);