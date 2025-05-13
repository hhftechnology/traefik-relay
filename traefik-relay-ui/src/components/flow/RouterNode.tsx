import { useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { HttpRouter, TcpRouter } from '../../types';

interface RouterNodeProps {
  data: {
    router: HttpRouter | TcpRouter;
    type: 'http' | 'tcp';
    server: string;
  };
}

const RouterNode = ({ data }: RouterNodeProps) => {
  const getBg = useCallback(() => {
    return data.type === 'http'
      ? useColorModeValue('cyan.50', 'cyan.900')
      : useColorModeValue('orange.50', 'orange.900');
  }, [data.type]);

  const getBorderColor = useCallback(() => {
    return data.type === 'http'
      ? useColorModeValue('cyan.400', 'cyan.600')
      : useColorModeValue('orange.400', 'orange.600');
  }, [data.type]);

  const router = data.router;
  
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Box
        padding="10px"
        borderRadius="md"
        bg={getBg()}
        borderWidth="2px"
        borderColor={getBorderColor()}
        width="150px"
      >
        <Badge
          colorScheme={data.type === 'http' ? 'cyan' : 'orange'}
          width="100%"
          textAlign="center"
          mb={1}
        >
          {data.type.toUpperCase()} Router
        </Badge>
        <Text fontWeight="bold" fontSize="sm" textAlign="center">
          {router.name}
        </Text>
        <Text fontSize="xs" mt={1} noOfLines={2} textAlign="center">
          {router.rule}
        </Text>
        {router.service && (
          <Text fontSize="xs" mt={1}>
            Service: <Badge>{router.service}</Badge>
          </Text>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

export default memo(RouterNode);