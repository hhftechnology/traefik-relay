import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Link,
  useDisclosure,
  Text,
  Stack,
  useColorModeValue,
  Icon,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Heading,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiServer,
  FiSettings,
  FiDatabase,
  FiMenu,
  FiX,
  FiNetwork,
} from 'react-icons/fi';

interface NavItemProps {
  icon: ReactNode;
  to: string;
  children: ReactNode;
  active?: boolean;
}

const NavItem = ({ icon, to, children, active = false }: NavItemProps) => {
  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="2"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        fontWeight={active ? 'bold' : 'normal'}
        color={active ? 'traefik.700' : 'gray.600'}
        bg={active ? 'traefik.50' : 'transparent'}
        _hover={{
          bg: 'traefik.50',
          color: 'traefik.700',
        }}
      >
        <Icon
          mr="4"
          fontSize="16"
          color={active ? 'traefik.500' : 'gray.500'}
          as={icon}
        />
        {children}
      </Flex>
    </Link>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  
  const NavItems = () => (
    <Stack spacing={0}>
      <NavItem 
        icon={FiHome} 
        to="/" 
        active={location.pathname === '/'}
      >
        Dashboard
      </NavItem>
      <NavItem 
        icon={FiNetwork} 
        to="/network" 
        active={location.pathname === '/network'}
      >
        Network View
      </NavItem>
      <NavItem 
        icon={FiSettings} 
        to="/configuration" 
        active={location.pathname === '/configuration'}
      >
        Configuration
      </NavItem>
      <NavItem 
        icon={FiDatabase} 
        to="/redis" 
        active={location.pathname === '/redis'}
      >
        Redis Explorer
      </NavItem>
    </Stack>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false}>
        <DrawerOverlay />
        <DrawerContent>
          <Box height="full" overflow="hidden" bg="white">
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
              <Flex alignItems="center">
                <Heading size="md" color="traefik.600">TraefikRelay</Heading>
              </Flex>
              <IconButton
                size="md"
                aria-label="Close menu"
                variant="ghost"
                icon={<FiX />}
                onClick={onClose}
              />
            </Flex>
            <NavItems />
          </Box>
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w={60}
        h="full"
        bg="white"
        position="fixed"
        borderRight="1px"
        borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Heading size="md" color="traefik.600">TraefikRelay</Heading>
        </Flex>
        <NavItems />
      </Box>
    </>
  );
};

const DashboardLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      <Sidebar isOpen={isOpen} onClose={onClose} />
      
      {/* Mobile Header */}
      <Box 
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        position="sticky"
        top={0}
        bg="white"
        zIndex={10}
        h="16"
        px={4}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <IconButton
          variant="ghost"
          onClick={onOpen}
          aria-label="open menu"
          icon={<FiMenu />}
        />
        <Heading size="md" ml={4} color="traefik.600">TraefikRelay</Heading>
      </Box>
      
      {/* Main Content */}
      <Box ml={{ base: 0, md: 60 }} p="4">
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;