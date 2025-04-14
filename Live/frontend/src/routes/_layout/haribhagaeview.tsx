import {
  Container,
  Table,
  TableContainer,
  Thead,
  Tr,
  Th,
  Box,
  Select,
  Tbody,
  Td,
  Flex,
  Button,
  Spinner,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CloseIcon } from "@chakra-ui/icons";
import { ItemsService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { formatDate } from "../../utils";
import { response } from "express";
import { MdCheckCircle, MdCancel } from 'react-icons/md';

interface SabhaItem {
  sabha_id: number;
  sabha_name: string;
  sabha_date: string;
  attendees: { haribhagat_id: number }[]; // Adjusted to represent attendees properly
}

interface Haribhagat {
  haribhagat_id: number;
  name: string;
}

interface ApiResponse {
  data: {
    data: SabhaItem[];
    pagination: {
      totalSabha: number;
    };
  };
}

function SabhaTable() {
  const showToast = useCustomToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const color = useColorModeValue("#060606", "#c5c5c5");
  const buttonColor = useColorModeValue("#fff", "#fff");
  const haribhagatId = new URLSearchParams(window.location.search).get('haribhagt_id');
  console.log("haribhgat_id",haribhagatId)
  const { data: items, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ["meetings", searchQuery, limit, currentPage],
    queryFn: async () => {
      const response = await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        haribhagatId
        // sort_key,
        // sort_order,
      });
      console.log("respons",response)
      return response;
    },
  });   
  const handleBack = () => {
    window.history.back();
  }; 
  const handleSearch = () => {
    setSearchQuery(inputValue);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchQuery("");
  };

  const filteredItems = items?.data?.sabhas || [];
  const totalRecords = items?.data?.pagination?.totalSabhas || 0;
  console.log("totalsabha",totalRecords)

  if (isError) {
    const errDetail = (error as any)?.body?.detail || "Unknown error";
    showToast("Error", errDetail, "error");
  }
  console.log("data-------",filteredItems)
  return (
    <Container maxW="full" mt={["15%", "10%", "3%"]}>
      {/* <Flex justify="space-between" mb={4}>
        <Box
          // position="absolute"
          top={[6, 7, 10]}
          left={{ base: 5, md: 9, lg: 1 }} // Mobile: 4, Tablet: 8, Desktop: 10
          zIndex={2}
          onClick={handleBack}
        >
          <Button
            variant="primary"
            bg="var(--chakra-colors-ui-main)"
            color={buttonColor}
            aria-label="Go back to Haribhagat list"
            px={[4, 6, 8]} // Mobile: 4, Tablet: 6, Desktop: 8
          >
            Back
          </Button>
        </Box>
        <InputGroup width={{ base: "100%", md: "300px" }}>
          <Input
            type="text"
            placeholder="Search meetings..."
            borderColor={color}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {inputValue && (
            <InputRightElement>
              <IconButton
                aria-label="Clear search"
                icon={<CloseIcon />}
                size="sm"
                onClick={handleClearSearch}
                variant="ghost"
              />
            </InputRightElement>
          )}
        </InputGroup>
        <Button onClick={handleSearch} colorScheme="blue">
          Search
        </Button>
      </Flex> */}

      <Flex
        mr={{ base: 0, md: 16 }}
        flexDirection={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Flex alignItems="center" mb={{ base: 0, md: 0 }}>
          {/* <Navbar type={"Item"} /> */}
          <Button
            variant="primary"
            bg="var(--chakra-colors-ui-main)"
            color={buttonColor}
            onClick={handleBack}
            aria-label="Go back to Haribhagat list"
            px={[4, 6, 8]} // Mobile: 4, Tablet: 6, Desktop: 8
          >
            Back
          </Button>
        </Flex>

        <Flex
          flexDirection={{ base: "column", md: "row" }}
          alignItems="flex-start"
          mt={{ base: 2, md: 4 }}
          width={{ base: "100%", md: "35%" }}
        >
          <InputGroup width="100%">
            <Input
              type="text"
              borderColor={color}
              placeholder="Search ...."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {inputValue && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear search"
                  icon={<CloseIcon />}
                  size="sm"
                  onClick={() => {
                    setInputValue("");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  variant="ghost"
                />
              </InputRightElement>
            )}
          </InputGroup>

          <Button
            colorScheme="blue"
            onClick={() => {
              setSearchQuery(inputValue);
              setCurrentPage(1);
            }}
            mt={{ base: 2, md: 0 }} // Margin-top on small screens for spacing
            ml={{ base: 1, md: 2 }} // Margin-left only on medium and larger screens
            width={{ base: "100%", md: "25%" }} // Full width on small screens, auto on larger
            variant="primary"
          >
            Search
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="lg" color="ui.main" />
        </Flex>
      ) : (
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>સભા ID</Th>
                <Th>સભા નું નામ</Th>
                <Th>તારીખ</Th>
                {/* <Th>Is Present</Th> */}
                <Th>હરિભગત સભા માં હાજર રહિયા</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((sabha ) => (
                <Tr key={sabha.sabha_id}>
                  <Td>{sabha.sabha_id}</Td>
                  <Td>{sabha.sabha_name}</Td>
                  <Td>{formatDate(sabha.sabha_date)}</Td>
                  <Td>
                  {
                    sabha.is_present
                      ? <MdCheckCircle color="green" />
                      : <MdCancel color="red" />
                  }
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Flex justify="flex-end" mt={4}>
      <Select
          value={limit}
          onChange={(e) => {
            const newLimit = Number(e.target.value);
            console.log("Selected limit: ", newLimit);
            setLimit(newLimit); // Update the limit
            setCurrentPage(1); // Reset to the first page when the limit changes
          }}
          width="120px"
          size="sm"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={totalRecords}>All</option>
        </Select>
      </Flex>

      <Flex justify="space-between" mt={4}>
        <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} isDisabled={currentPage === 1}>
          Previous
        </Button>
        <Button onClick={() => setCurrentPage((prev) => (prev < Math.ceil(totalRecords / limit) ? prev + 1 : prev))} isDisabled={currentPage >= Math.ceil(totalRecords / limit)}>
          Next
        </Button>
      </Flex>
    </Container>
  );
}

export default SabhaTable;

export const Route = createFileRoute("/_layout/haribhagaeview")({
  component: SabhaTable,
});
