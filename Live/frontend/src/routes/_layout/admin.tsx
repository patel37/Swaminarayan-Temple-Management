import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Button,
  Td,
  Th,
  Thead,
  Tr,
  Icon,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { type UserOut, UsersService } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu"
import Navbar from "../../components/Common/Navbar"
import useCustomToast from "../../hooks/useCustomToast"
import { FaPlus } from "react-icons/fa";

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
})

function Admin() {
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role");
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const currentUser = queryClient.getQueryData<UserOut>(["currentUser"])
  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.readUsers({}),
  })

  if (isError) {
    const errDetail = (error as any).body?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
  }
  if (role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  return (
    <>
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        users && (
          <Container maxW="full">
            <Heading
              size="lg"
              textAlign={{ base: "center", md: "left" }}
              pt={12}
            >
              User Management
            </Heading>
            {/* <Navbar type={"User"} /> */}
           
            <Link to={"/Adduseradmin"}>
            <Button
          variant="primary"
          gap={1}
          fontSize={{ base: "sm", md: "inherit" }}
        >
          <Icon as={FaPlus} /> યૂઝર ઉમેરો
        </Button>
            </Link>
            <TableContainer>
              <Table fontSize="md" size={{ base: "sm", md: "md" }}>
                <Thead>
                  <Tr>
                    <Th>પૂરું નામ</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.data.map((user) => (
                    <Tr key={user.id}>
                      <Td color={!user.first_name ? "ui.dim" : "inherit"}>
                        {user.first_name || "N/A"}
                        {currentUser?.id === user.id && (
                          <Badge ml="1" colorScheme="teal">
                            You
                          </Badge>
                        )}
                      </Td>
                      <Td>{user.email}</Td>
                      <Td>{user.role}</Td>
                      {/* <Td>{user.user_type ? "Superuser" : "Admin"}</Td> */}
                      <Td>
                        <Flex gap={2}>
                          <Box
                            w="2"
                            h="2"
                            borderRadius="50%"
                            bg={user.status ==="Active" ? "ui.success" : "ui.danger"}
                            alignSelf="center"
                          />
                          {/* {user.is_active ? "Active" : "Inactive"} */}
                          {user.status}
                        </Flex>
                      </Td>
                      <Td>
                        <ActionsMenu
                          type="User"
                          value={user}
                          disabled={currentUser?.id === user.id ? true : false}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Container>
        )
      )}
    </>
  )
}