// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={6} p={8} maxW="500px" textAlign="center">
            <Heading size="lg" color="red.500">Something went wrong</Heading>
            <Text>
              There was a problem loading the TraefikRelay dashboard. This could be due to 
              a network issue or a problem with the application.
            </Text>
            <Button 
              leftIcon={<FiRefreshCw />} 
              colorScheme="blue" 
              onClick={this.handleReload}
            >
              Reload Application
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;