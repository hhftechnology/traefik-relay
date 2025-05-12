import { useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';

const ServiceNode = ({ data }) => {
  const getBg = useCallback(() => {
    return useColorModeValue('teal.50', 'teal.900');
  }, []);

  const getBorderColor = useCallback(() => {
    return useColorModeValue('teal.400', 'teal.600');
  }, []);

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
          colorScheme="teal"
          width="100%"
          textAlign="center"
          mb={1}
        >
          Service
        </Badge>
        <Text fontWeight="bold" fontSize="sm" textAlign="center">
          {data.service}
        </Text>
        <Text fontSize="xs" mt={1}>
          Server: <Badge variant="outline">{data.server}</Badge>
        </Text>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

export default memo(ServiceNode);