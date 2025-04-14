import {
  Container,
  Flex,
  Heading,
  useColorModeValue,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Checkbox,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Select,
  IconButton,
  Spinner
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { IoIosArrowBack } from "react-icons/io";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { serviceSabha, type ApiError, sabhaUpdate, ItemsService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/Attendance")({
  component: Attendance,
});

interface HaribhagatItem {
  haribhagat_id: string | number;
  surname: string;
  first_name: string;
  middle_name: string;
  mobile_country_code: string;
  mobile: string;
  isAttending?: boolean;
  date?: string;
}

interface ApiResponse {
  data: {
    data: HaribhagatItem[];
    pagination: {
      totalRecords: number;
    };
  };
}

function Attendance() {
  const showToast = useCustomToast();
  const role = localStorage.getItem("user_role");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPresent, setTotalPresentRecords] = useState(0);
  const [sabhaId, setSabhaId] = useState(`${new URLSearchParams(window.location.search).get("sabha_id")}`);
  // let sabhaId = new URLSearchParams(window.location.search).get("sabha_id");
  const [limit, setLimit] = useState(100);
  const [sortKey, setSortKey] = useState<keyof HaribhagatItem>("haribhagat_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const queryClient = useQueryClient();
  const color = useColorModeValue("#060606", "#c5c5c5");
  const buttonColor = useColorModeValue("#fff", "#fff");
  // let sabhaId = new URLSearchParams(window.location.search).get("sabha_id");
  const onlyPresent = new URLSearchParams(window.location.search).get("only_present") ? true :false;

  // if (!sabhaId) {
  //   console.log("---searchQuery--- sabahid");
  //   showToast("Error", "Missing sabha_id in the URL.", "error");
  //   return null;
  // }



  const { data: items, isError, error, isLoading } = useQuery<ApiResponse>({
    queryKey: ["hari_bhagat", currentPage, searchQuery, limit, sortKey, sortOrder],
    queryFn: async () => {
      const response = await serviceSabha.getHaribhagt({
        page: currentPage,
        limit,
        sabha_id: sabhaId,
        search: searchQuery,
        sort_key: sortKey,
        sort_order: sortOrder,
        only_present: onlyPresent,
      });
      if (response.data?.pagination) {
        console.log("sabhaId---222-",sabhaId)
        if (sabhaId == null || sabhaId == 'null') {
          console.log(sabhaId)
          console.log(response)
          setSabhaId(response.data?.sabha_id);
          
        }
        setTotalRecords(response.data.pagination.totalRecords);
        setTotalPresentRecords(response.data.pagination.totalPresent);
     
        
      }else{
        showToast("Error", response?.error?.message, "error");
      }
      return response;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: sabhaUpdate) => ItemsService.updateSabha(data),
    onSuccess: () => {
      showToast("Success!", "Attendance updated successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["hari_bhagat"] });
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail;
      showToast("Something went wrong.", errDetail, "error");
    },
  });

  if (isError) {
    const errDetail = (error as any).body?.detail;
    showToast("Something went wrong.", errDetail, "error");
  }

  // const handleCheckboxClick = (item: HaribhagatItem) => {
  //   const dataSubmit: sabhaUpdate = {
  //     haribhagat_id: item.haribhagat_id,
  //     sabha_id: sabhaId,
  //   };
  //   mutation.mutate(dataSubmit);
  // };
  const handleCheckboxClick = (item: HaribhagatItem) => {
    if (item.isAttending) {
      // If isAttending is true, prompt for password when trying to uncheck
      const enteredPassword = prompt("Please enter the password to change attendance:");
      if (enteredPassword === "HK79VDS79") {
        // If password is correct, allow unchecking the box (update attendance)
        const dataSubmit: sabhaUpdate = {
          haribhagat_id: item.haribhagat_id,
          sabha_id: sabhaId,
        };
        mutation.mutate(dataSubmit);  // Update attendance in the database
      } else {
        // If password is incorrect, prevent unchecking and show an error
        alert("Incorrect password. Cannot uncheck attendance.");
      }
    } else {
      // If isAttending is false, no password required, just update attendance normally
      const dataSubmit: sabhaUpdate = {
        haribhagat_id: item.haribhagat_id,
        sabha_id: sabhaId,
      };
      mutation.mutate(dataSubmit);  // Update attendance in the database
    }
  };

  const filteredItems = items?.data?.data || [];

  const handleSearchButtonClick = () => {
    if (inputValue) {
      setSearchQuery(inputValue);
      setCurrentPage(1);
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSort = (key: keyof HaribhagatItem) => {
    if (sortKey === key) {
      setSortKey(key);
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <>
     {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        items && ( 
      <Container maxW="full" px={[4, 8, 12]} pt={[6, 10, 12]}>
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12} pt={{base: 0, md: 0}}>
        {role === "admin" && 
          <Link to={"/sabhadata"}>
            <Button
              variant="primary"
              mr={5}
              color={buttonColor}
              size={["sm", "md"]}
            >
              <IoIosArrowBack /> Back
            </Button>
          </Link>}

            હાજર હરિભગત ({totalPresent})
          <Flex  mt={{base: 4, md: 0}} flexDirection={{ base: "column", md: "row" }} justifyContent="flex-end" alignItems="center" mr={{ base: 0, md: 16 }}>
            <InputGroup width={{ base: "100%", md: "300px" }} >
              <Input
                type="text"
                placeholder="Search ...."
                value={inputValue}
                borderColor={color}
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
                    onClick={() => handleClearInput()}
                    variant="ghost"
                  />
                </InputRightElement>
              )}
            </InputGroup>
            <Button
              onClick={handleSearchButtonClick}
              ml={{ base: 0, md: 2 }}
              mt={{ base: 2, md: 0 }}
              width={{ base: "100%", md: "auto" }}
              variant="primary"
            >
              Search
            </Button>
          </Flex>
        </Heading>
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                {!onlyPresent &&   <Th onClick={() => handleSort("isAttending")} style={{ cursor: "pointer" }}>
                  હાજરી {sortKey === "isAttending" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </Th> }
                <Th onClick={() => handleSort("haribhagat_id")} style={{ cursor: "pointer" }}>
                  Id {sortKey === "haribhagat_id" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th onClick={() => handleSort("surname")} style={{ cursor: "pointer" }}>
                  પુરું નામ {sortKey === "surname" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th onClick={() => handleSort("mobile")} style={{ cursor: "pointer" }}>
                  મોબાઈલ નંબર {sortKey === "mobile" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </Th>
                <Th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                  Date {sortKey === "date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </Th>
               
                {/* <Th>હાજરી</Th> */}
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item: HaribhagatItem) => (
                <Tr key={item.haribhagat_id}>
                   {!onlyPresent &&     <Td>
                    <Checkbox
                      colorScheme="green"
                      isChecked={item.isAttending}
                      // isDisabled={item.isAttending && !item.isChecked}
                      onChange={() => handleCheckboxClick(item)}
                    />
                  </Td> }
                  <Td>{item.haribhagat_id}</Td>
                  <Td>{`${item.surname} ${item.first_name} ${item.middle_name}`}</Td>
                  <Td>{`${item.mobile_country_code} ${item.mobile}`}</Td>
                  <Td>{new Date().toLocaleDateString()}</Td>
                
              
                  

                </Tr>
              ))}
            </Tbody>
          </Table>

        </TableContainer>
        <Flex mt={4} justifyContent="flex-end">
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
            onClick={() =>
              setCurrentPage((prev) =>
                prev < Math.ceil(totalRecords / limit) ? prev + 1 : prev
              )
            }
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

export default Attendance;

