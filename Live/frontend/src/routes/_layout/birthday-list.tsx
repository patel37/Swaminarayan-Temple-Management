import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Select, // Import Select for the dropdown
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react" // Import useState to manage the limit state

import { ItemsService } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu"
import Navbar from "../../components/Common/Navbar"
import useCustomToast from "../../hooks/useCustomToast"
import { formatDate } from "../../utils"

export const Route = createFileRoute("/_layout/birthday-list")({
  component: Items,
})

function Items() {
  const showToast = useCustomToast()
  const [birthdayLimit, setBirthdayLimit] = useState(7);

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hari_bhagat", birthdayLimit], 
    queryFn: () => ItemsService.readItems({ upcoming_birthdays: true, birthday_limit_days: birthdayLimit }),
  })

  if (isError) {
    const errDetail = (error as any).body?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
  }

  return (
    <>
      {isLoading ? (
      
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        items && (
          <Container maxW="full">
            <Heading
              size="md"
              textAlign={{ base: "center", md: "left" }}
              pt={12}
            >
              આગામી {birthdayLimit} દિવસોમાં જન્મદિવસ આવતા હરિભગત ની યાદી ({items.data.length})
            </Heading>
            <Navbar type={"Item"} />

           
            <Flex mt={4} justifyContent="flex-end" alignItems="center">
              <Select
                value={birthdayLimit}
                onChange={(e) => setBirthdayLimit(Number(e.target.value))} // Update the limit based on user selection
                width="200px"
                size="sm"
                mr={4}
              >
                <option value={7}>Next 7 Days</option>
                <option value={14}>Next 14 Days</option>
                <option value={30}>Next 30 Days</option>
              </Select>
            </Flex>

            <TableContainer>
              <Table size={{ base: "sm", md: "md" }}>
                <Thead>
                  <Tr>
                    <Th>Id</Th>
                    <Th>પૂરું નામ</Th>
                    <Th>મોબાઈલ નંબર</Th>
                    <Th>ઈ-મેલ</Th>
                    <Th>જન્મ તારીખ</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.data.map((item) => (
                    <Tr key={item.haribhagat_id}>
                      <Td>{item.haribhagat_id}</Td>
                      <Td>{`${item.surname} ${item.first_name} ${item.middle_name}`}</Td>
                      <Td>{`${item.mobile_country_code} ${item.mobile}`}</Td>
                      <Td>{item.email}</Td>
                      <Td>{formatDate(item.birth_date)}</Td>
                      <Td>
                        <ActionsMenu type={"Item"} value={item} />
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
