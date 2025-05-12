import { Box, Spinner, Text, Center } from '@chakra-ui/react';

const LoadingSpinner = () => {
  return (
    <Center h="200px">
      <Box textAlign="center">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="traefik.500"
          size="xl"
        />
        <Text mt={4} color="gray.600">Loading...</Text>
      </Box>
    </Center>
  );
};

export default LoadingSpinner;