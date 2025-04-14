import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  useColorModeValue,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Input,
  Button,
  useDisclosure,
  Icon,
  InputGroup,
  InputRightElement,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { serviceSabha } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { FaPlus } from "react-icons/fa";
import { CloseIcon } from "@chakra-ui/icons";
import { formatDate } from "../../utils";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import ActionsSabhaMenu from "../../components/Common/SabhaActionsMenu";

export const Route = createFileRoute("/_layout/sabhadata")({
  component: sabha,
});

interface SabhaItem {
  sabha_id: string | number;
  sabha_name: string;
  sabha_date: string;
}

function sabha() {
  const showToast = useCustomToast();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const addUserModal = useDisclosure();
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const addItemModal = useDisclosure();
  // const color = useColorModeValue("#060606", "#c5c5c5");
  const color = useColorModeValue('inherit', 'ui.light');
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role");
  // States for sorting
  const [sort_key, setSortKey] = useState<keyof SabhaItem>("sabha_id");
  const [sort_order, setSortOrder] = useState<"asc" | "desc">("desc");

  // API call triggered by useQuery
  const { data: items, isLoading, isError, error } = useQuery({
    queryKey: ["haribhagat_sabha", currentPage,limit,searchQuery, sort_key, sort_order],
    queryFn: () =>
      serviceSabha.readSabha({
        page:currentPage,
        limit,
        search: searchQuery,
        sort_key,
        sort_order,
      }),
  });

  // Error handling
  if (isError) {
    const errDetail = (error as any).body?.detail;
    showToast("Something went wrong.", `${errDetail}`, "error");
  }

  // Filter items based on search query
  const filteredItems =
    items?.data?.data?.filter((item) => {
      const fullName = item.sabha_name.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    }) || [];
  console.log("filteritems",filteredItems)
  // Event handler for search button click
  const handleSearchButtonClick = () => {
    if (inputValue) {
      setSearchQuery(inputValue);
    }
  };
  useEffect(() => {
    const savedLimit = localStorage.getItem('sabhaLimit');
    if (savedLimit) {
      setLimit(Number(savedLimit));
    }
  }, []);
  const totalRecords = items?.data.pagination.totalRecords || 0;
  // Event handler to clear search input
  const handleClearInput = () => {
    setInputValue("");
    setSearchQuery("");
  };

  // Sorting logic
  const handleSort = (key: keyof SabhaItem) => {
    if (sort_key === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

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
        items && (
          <Container maxW="full">
            <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
              હરિભગત ની સભા ({filteredItems.length})
            </Heading>



            <Flex 
                mt={4} 
                flexDirection={{ base: "row", md: "row" }} // Ensure it is row for both mobile and desktop
                justifyContent="space-between" // Align buttons in a row with space between them
                alignItems="center" // Align the items vertically center
                mr={{ base: 0, md: 16 }}
                wrap="wrap" // Ensure buttons wrap when necessary (for mobile)
              >
                <Link to="/sabhaform">
                  <Button
                    mr={5}
                    variant="primary"
                    gap={1}
                    fontSize={{ base: "sm", md: "inherit" }}
                    mb={{ base: 2, md: 0 }} // Margin bottom for mobile to create some space
                  >
                    <Icon as={FaPlus} /> ન્યુ સભા
                  </Button>
                </Link>

                <Link to={"/sabhaAnalytics"}>
                  <Button
                    variant="primary"
                    gap={1}
                    fontSize={{ base: "sm", md: "inherit" }}
                    mb={{ base: 2, md: 0 }} // Margin bottom for mobile to create some space
                  >
                    સભા નુ વિશ્લેષણ
                  </Button>
                </Link>

                <InputGroup 
                  width={{ base: "100%", md: "300px" }} 
                  ml={["0", "auto"]} 
                  mb={5}  
                  mt={{ base: 0, md: 5 }}
                >
                  <Input
                    type="text"
                    borderColor={color}
                    placeholder="Search ...."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearchQuery(inputValue);
                        setCurrentPage(1);
                      }
                    }}
                  />
                  {inputValue && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<CloseIcon />}
                        size="sm"
                        onClick={handleClearInput}
                        variant="ghost"
                      />
                    </InputRightElement>
                  )}
                </InputGroup>

                <Button
                  colorScheme="blue"
                  onClick={handleSearchButtonClick}
                  ml={{ base: 0, md: 2 }}
                  mt={{ base: 2, md: 0 }}
                  width={{ base: "100%", md: "auto" }}
                  variant="primary"
                >
                  Search
                </Button>
              </Flex>


            {/* <Sabha isOpen={addUserModal.isOpen} onClose={addUserModal.onClose} />
            <AddItem isOpen={addItemModal.isOpen} onClose={addItemModal.onClose} /> */}

            <TableContainer>
              <Table size={{ base: "sm", md: "md" }} mt={{ base: 5, md: 0 }}>
                <Thead>
                  <Tr>
                    <Th onClick={() => handleSort("sabha_id")} style={{ cursor: "pointer" }}>
                      Id {sort_key === "sabha_id" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                    </Th>
                    <Th onClick={() => handleSort("sabha_name")} style={{ cursor: "pointer" }}>
                      સભા {sort_key === "sabha_name" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                    </Th>
                    <Th>સમય</Th>
                    <Th>આવેલા હરિભક્તો</Th>
                    <Th onClick={() => handleSort("sabha_date")} style={{ cursor: "pointer" }}>
                      તારીખ {sort_key === "sabha_date" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                    </Th>
                    <Th>હરિભગતની હાજરી</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredItems.map((item) => (
                    <Tr key={item.sabha_id}>
                      <Td>{item.sabha_id}</Td>
                      <Td>{item.sabha_name}</Td>
                      <Td>
                        {item.from_time || "--:--:--"} <b>To</b> {item.to_time || "--:--:--"}
                      </Td>
                      
                      <Td>
                        
                        {item.attendees}
                      
                      </Td>
                      <Td>{formatDate(item.sabha_date)}</Td>
                      <Td>
                        <Link to={`/Attendance?sabha_id=${item.sabha_id}`}>
                          <Button variant="primary">હાજરી</Button>
                        </Link>
                      </Td>
                      <Td>
                        <ActionsSabhaMenu type={"Item"} value={item} />
                      </Td>
                      {/* <Td>
                        <Link to={`/AttendanceView?sabha_id=${item.sabha_id}`}>
                          <Button variant="primary">વ્યૂ </Button>
                        </Link>
                      </Td> */}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <Flex justify="flex-end" mt={4}>
        <Select
          value={limit}
          onChange={(e) => {
            const newLimit = Number(e.target.value);
            console.log("Selected limit: ", newLimit);
            setLimit(newLimit);
            localStorage.setItem('limit', newLimit.toString());
            setCurrentPage(1);
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
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          isDisabled={currentPage === 1}
            >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentPage((prev) => (prev < Math.ceil(totalRecords / limit) ? prev + 1 : prev))}
          isDisabled={currentPage >= Math.ceil(totalRecords / limit)}
        >
          Next
        </Button>
      </Flex>
          </Container>
        )
      )}
    </>
  );
}

export default sabha;
