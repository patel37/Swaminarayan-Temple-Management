import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tooltip,
  Th,
  Thead,
  useColorModeValue,
  Tr,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  Select,
  Icon,
  Box,
} from "@chakra-ui/react";
import { HiDownload } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ItemsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import Navbar from "../../components/Common/Navbar";
import useCustomToast from "../../hooks/useCustomToast";
import { formatDate } from "../../utils";
import { CloseIcon } from "@chakra-ui/icons";
import { useNavigate } from "@tanstack/react-router";
// import { Link } from "@tanstack/react-router";
// import { ViewIcon } from "@chakra-ui/icons";

// Default image URL
const defaultImageUrl = "https://via.placeholder.com/50";

export const Route = createFileRoute("/_layout/haribhagat-photo")({
  component: Items,
});

interface HaribhagatId {
  haribhagat_id: string | number;
  surname: string;
  first_name: string;
  middle_name: string;
  mobile_country_code: string;
  mobile: string;
  isAttending?: boolean;
  email: string;
  birth_date: string;
  profile_picture?: string;
}

interface ApiResponse {
  data: {
    data: HaribhagatId[];
    pagination: {
      totalRecords: number;
    };
  };
}

function Items() {
  const showToast = useCustomToast();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const color = useColorModeValue("#060606", "#c5c5c5");
  const buttonColor = useColorModeValue("#fff", "#fff");
  // const limit = 10;


  const [sort_key, setSortKey] = useState<keyof HaribhagatId>("haribhagat_id");
  const [sort_order, setSortOrder] = useState<"asc" | "desc">("asc");


  const { data, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ["hari_bhagat", currentPage, searchQuery, limit, sort_key, sort_order],
    queryFn: async () => {
      const response = await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        sort_key,
        sort_order,
      });
      return response;
    },
    onError: (err) => {
      const errDetail = (err as any).body?.detail;
      showToast("Something went wrong.", errDetail, "error");
    },
  });


  const handleSearchButtonClick = () => {
    setSearchQuery(inputValue); // Set search query to filter results
    setCurrentPage(1); // Reset to first page after a new search
  };

  // Clear input and reset search
  const handleClearInput = () => {
    setInputValue("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  if (isError) {
    const errDetail = (error as any).body?.detail;
    showToast("Something went wrong.", `${errDetail}`, "error");
  }

  const items = data?.data.data || [];
  const totalRecords = data?.data.pagination.totalRecords || 0;


  const sortedItems = [...items].sort((a, b) => {
    const aValue = typeof a[sort_key] === 'string' ? Number(a[sort_key]) : a[sort_key];
    const bValue = typeof b[sort_key] === 'string' ? Number(b[sort_key]) : b[sort_key];

    if (sort_order === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  const handleDownloadPdf = async () => {
    try {
      const response = await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        printPdf: "true",
      });

      console.log("---response", response)
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'haribhagat_list.pdf'); // Set filename
      document.body.appendChild(link);
      link.click();
      link.remove(); // Remove the link after download
    } catch (error) {
      showToast("Error downloading PDF.", error.message, "error");
    }
  };

  const handleSort = (key: keyof HaribhagatId) => {
    if (sort_key === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role");
  if (role !== "admin") {
    navigate({ to: "/" });
    return null;
  }
  return (
    <>
      {/* {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        items && ( */}
      <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
            હરિભગત ના ફોટા સાથે ની યાદી  ({totalRecords})
          </Heading>
        {/* <Flex
          justify={{ base: "center", md: "space-between" }}
          align="center"
          flexDirection={{ base: "column", md: "row" }}
          pt={5}
        >
          <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
            હરિભગત ના ફોટા સાથે ની યાદી  ({totalRecords})
          </Heading>
          {role === "admin" && 
          <Button
            variant="primary"
            gap={1}
            fontSize={{ base: "sm", md: "inherit" }}
            onClick={handleDownloadPdf}
            mt={{ base: 4, md: 5 }}
            mr={{ base: 0, md: 16 }}
            width={{ base: "60%", md: "auto" }}
          >
            <Icon as={HiDownload} /> Download PDF
          </Button>}
        </Flex> */}

        {/* <Flex
          mr={{ base: 0, md: 16 }}
          mt={4}
          flexDirection={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Flex alignItems="center" mb={{ base: 4, md: 0 }}>
            <Navbar type={"Item"} />
          </Flex>

          <Flex
            flexDirection={{ base: "column", md: "row" }} // Stack vertically on small screens
            alignItems="flex-start"
            mt={{ base: 2, md: "30px" }}
            width={{ base: "100%", md: "35%" }} // Take full width on small screens
          >
            <InputGroup width="100%">
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
        </Flex> */}
     
          <Flex 
                // mt={4} 
                flexDirection={{ base: "row", md: "row" }} // Ensure it is row for both mobile and desktop
                justifyContent="space-between" // Align buttons in a row with space between them
                alignItems="center" // Align the items vertically center
                mr={{ base: 0, md: 0 }}
                wrap="wrap" // Ensure buttons wrap when necessary (for mobile)
              >
                {/* <Flex alignItems="center" mb={{ base: 4, md: 0 }}> */}
          <Navbar type={"Item"} />
        {/* </Flex> */}

               

        {role === "admin" && 
          <Button
            variant="primary"
            gap={1}
            fontSize={{ base: "sm", md: "inherit" }}
            onClick={handleDownloadPdf}
            mb={{ base: 0, md: 0 }}
            ml={{ base: 0, md: 5}}
          >
            <Icon as={HiDownload} /> Download PDF
          </Button>}

          

                <InputGroup   
                  width={{ base: "100%", md: "30%" }} 
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
            ml={{ base: 0, md: 2 }}
            mt={{ base: 0, md: 0 }}
            width={{ base: "100%", md: "10%" }}
            variant="primary"
          >
            Search
          </Button>
    </Flex>
        <TableContainer>
          <Table size={{ base: "sm", md: "md" }} mt={{ base: 4, md: 2 }}>
            <Thead>
              <Tr>
                <Th>
                  હરિભગત નો ફોટો
                </Th>
                <Th onClick={() => handleSort("haribhagat_id")} style={{ cursor: "pointer" }}>
                  Id {sort_key === "haribhagat_id" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th onClick={() => handleSort("surname")} style={{ cursor: "pointer" }}>
                  પૂર્ણ નામ {sort_key === "surname" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th onClick={() => handleSort("mobile")} style={{ cursor: "pointer" }}>
                  મોબાઈલ નંબર {sort_key === "mobile" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                </Th>
                {/* <Th onClick={() => handleSort("email")} style={{ cursor: "pointer" }}>
                  ઈ-મેલ {sort_key === "email" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                </Th> */}
                <Th onClick={() => handleSort("birth_date")} style={{ cursor: "pointer" }}>
                  જન્મ તારીખ {sort_key === "birth_date" ? (sort_order === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedItems.map((item) => (
                <Tr key={item.haribhagat_id}>
                  <Td  style={{paddingTop:"7px",paddingBottom:"7px"}}>
                    <Image
                      src={item.profile_picture || defaultImageUrl}
                      alt={`Profile Picture of ${item.first_name}`}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="full"
                    />
                  </Td>
                  <Td>{item.haribhagat_id}</Td>
                  <Td>{`${item.surname} ${item.first_name} ${item.middle_name}`}</Td>
                  <Td>{`${item.mobile_country_code} ${item.mobile}`}</Td>
                  {/* <Td>{item.email}</Td> */}
                  <Td>{formatDate(item.birth_date)}</Td>
                  <Td>
                        <ActionsMenu type={"Item"} value={item} />
                      </Td>
                  {/* <Td>
                    <Box mt={5}>
                      <Flex align="center" style={{ display: "flex", gap: "10px" }} >
                        <Tooltip label="View" aria-label="View" placement="top">
                          <Link
                            to={`/viewharibhagatpage?haribhagat_id=${item.haribhagat_id}`}
                            cursor="pointer"
                            _hover={{ color: "blue.500" }}
                          >
                            <ViewIcon />
                          </Link>
                        </Tooltip>
                        <ActionsMenu type={"Item"} value={item} />
                      </Flex>
                    </Box>
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
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            width="120px"
            size="sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
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
      {/* )
      )} */}
    </>
  );
}

export default Items;


