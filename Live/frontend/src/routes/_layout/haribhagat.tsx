import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Icon,
  Th,
  Thead,
  Tr,
  Box,
  Select,
  Input,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  IconButton,
  Tooltip,
  Button,
} from "@chakra-ui/react";
import { HiDownload } from "react-icons/hi";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ItemsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import useCustomToast from "../../hooks/useCustomToast";
import Navbar from "../../components/Common/Navbar";
import { ViewIcon } from "@chakra-ui/icons";
import { formatDate } from "../../utils";
import { CloseIcon } from "@chakra-ui/icons";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/haribhagat")({
  component: Items,
});

interface HaribhagatId {
  haribhagat_id: string | number;
  surname: string;
  first_name: string;
  middle_name: string;
  mobile_country_code: string;
  mobile: string;
  gender?: string; // Assuming gender field is available
  email: string;
  birth_date: string;
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
  const [limit, setLimit] = useState(10);
  const color = useColorModeValue("#060606", "#c5c5c5");
  const gender = new URLSearchParams(window.location.search).get('gender');

  const [sort_key, setSortKey] = useState<keyof HaribhagatId>("haribhagat_id");
  const [sort_order, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["hari_bhagat", currentPage, searchQuery, limit, sort_key, sort_order, gender],
    queryFn: async () => {
      const response = await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        sort_key,
        sort_order,
        gender: gender, // Pass gender to the API
      });
      console.log('gender',gender)
      return response;
    },
    onError: (err) => {
      const errDetail = (err as any).body?.detail;
      showToast("Something went wrong.", errDetail, "error");
    },
  });
  useEffect(() => {
    const savedLimit = localStorage.getItem('limit');
    if (savedLimit) {
      setLimit(Number(savedLimit));
    }
  }, []);
  const items = data?.data.data || [];
  const totalRecords = data?.data.pagination.totalRecords || 0;

  // Filter items by gender if gender is provided in URL
  const filteredItems = gender ? items.filter(item => item.gender === gender) : items;

  // Toggle Sort Order
  const handleSort = (key: keyof HaribhagatId) => {
    if (sort_key === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        printPdf: true,
        sort_key,
        sort_order,
        gender: gender,
        is_verified: true,
      });
    } catch (error) {
      showToast("Error downloading PDF.", error.message, "error");
    }
  };

  const role = localStorage.getItem("user_role");

  return (
    <Container maxW="full">
       <Heading size="lg" textAlign={{ base: "center", md: "left" }} mt={{ base: 7, md: 10 }}>
            {gender === "Male"
            ? "પુરૂષ હરિભગત ની યાદી"
            : gender === "Female"
            ? "મહિલા હરિભગત ની યાદી"
            : "હરિભગત ની યાદી"} ({totalRecords})
        </Heading>
        <Flex 
          flexDirection={{ base: "row", md: "row" }} // Ensure it is row for both mobile and desktop
          justifyContent="space-between" // Align buttons in a row with space between them
          alignItems="center" // Align the items vertically center
          mr={{ base: 0, md: 0 }}
          wrap="wrap" // Ensure buttons wrap when necessary (for mobile)
        >
        <Navbar type={"Item"} />

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

      <TableContainer >
        <Table size={{ base: "sm", md: "md" }} mt={{ base: 4, md: 5 }} >
          <Thead>
            <Tr>
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
            {filteredItems.map((item) => (
              <Tr key={item.haribhagat_id}>
                <Td>{item.haribhagat_id}</Td>
                <Td>{`${item.surname} ${item.first_name} ${item.middle_name}`}</Td>
                <Td>{`${item.mobile_country_code} ${item.mobile}`}</Td>
                {/* <Td>{item.email}</Td> */}
                <Td>{formatDate(item.birth_date)}</Td>
                <Td>
                  <ActionsMenu type={"Item"} value={item} />
                </Td>
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
  );
}

export default Items;


