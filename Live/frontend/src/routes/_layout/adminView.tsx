

import {
  Center,
  Button,
  Text,
  Heading,
  Stack,
  Box,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import { FaEnvelope, FaUserFriends,FaPhone } from "react-icons/fa";
import type { UserOut } from "../../client";
import { useQuery } from "@tanstack/react-query";

import { createFileRoute, Link } from "@tanstack/react-router";
import { UsersService } from "../../client";

interface ApiResponse {
  data: UserOut[]; // Expecting an array of users
}
interface ViewUserProps {
  user: UserOut; // Pass the user object
  isOpen: boolean; // Boolean to control modal visibility
  onClose: () => void; // Function to close the modal
}


const ViewUser = () => {
  const styleCont = {
    m: 2,
  };

  const UserId = new URLSearchParams(window.location.search).get("user_id");

  const { data } = useQuery<ApiResponse | null>({
    queryKey: ["hari_bhagat", UserId],
    queryFn: async () => {
      if (UserId) {
        const response = await UsersService.getviewpage({ user_id: UserId });
        console.log("Api response data:", response); // Log the entire response
        return response;
      }
      return null;
    },
    enabled: !!UserId,
  });

  // Find the specific user based on user_id
  const user = data?.data.find((u) => u.id === UserId) || null;

  const cardBg = useColorModeValue("gray.50", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const buttonColor = useColorModeValue("#fff", "#fff");
  const backgroundGradient = useColorModeValue(
    "linear(to-r, #acd4d0, #79acdb)",
    "linear(to-r, #000000ba,#00000024)"
  );

  return (
    <Flex
      w="100%"
      minH="50vh"
      alignItems="center"
      justifyContent="center"
      p={[4, 6, 8]}
      bg={useColorModeValue("gray.100", "gray.800")}
      position="relative"
    >
      <Box position="absolute" top={6} left={{ base: 9, sm: 2, md: 0, lg: 1 }} zIndex={2}>
        <Link to="/admin">
          <Button variant="primary" bg="var(--chakra-colors-ui-main)" color={buttonColor} px={6}>
            Back
          </Button>
        </Link>
      </Box>

      <Flex
        maxW={["100%", "100%", "800px"]}
        mx="auto"
        p={10}
        border="1px solid"
        borderColor={cardBorderColor}
        borderRadius="md"
        boxShadow="lg"
        bg={cardBg}
        bgGradient={backgroundGradient}
        zIndex={1}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {user ? (
          <Box flex="2" ml={[0, 8]} textAlign="left">
            <HStack justifyContent="space-between" alignItems="center" width="100%">
              <Heading size="md" color={textColor} >
                View User
              </Heading>
            </HStack>

            <Stack mt={4} spacing={0}>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="teal.400" />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">ID : </Text>
                  {user.id || "N/A"}
                </Text>
              </HStack>
              <HStack spacing={2} mt={2}>
                <Icon as={FaUserFriends} color="teal.400" />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">પૂરુ નામ : </Text>
                  {user.first_name || "N/A"}
                </Text>
              </HStack>
              <HStack spacing={2} mt={2}>
              <Icon as={FaPhone} color="blue.400" />
              <Text {...styleCont}>
                <Text as="span" fontWeight="bold">મોબાઈલ નંબર : </Text>
                {user.mobile}
              </Text>
            </HStack>
              <HStack spacing={2} mt={2}>
                <Icon as={FaEnvelope} color="purple.400" />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">ઈ-મેલ: </Text>
                  {user.email || "N/A"}
                </Text>
              </HStack>
            </Stack>
          </Box>
        ) : (
          <Text>No user data found.</Text>
        )}
      </Flex>
    </Flex>
  );
};

export default ViewUser;

export const Route = createFileRoute("/_layout/adminView")({
  component: ViewUser,
});
