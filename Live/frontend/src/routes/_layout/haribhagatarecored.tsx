import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  // Icon,
  Th,
  Thead,
  Tooltip,
  Tr,
  // Select,
  // Input,
  // InputGroup,
  // InputRightElement,
  // useColorModeValue,
  // IconButton,
  // Button,
} from "@chakra-ui/react";
// import axios from 'axios';
// import { HiDownload } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ItemsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import useCustomToast from "../../hooks/useCustomToast";
import { RiVerifiedBadgeLine } from "react-icons/ri";
import { EditIcon, ViewIcon, DeleteIcon } from "@chakra-ui/icons";
import { useNavigate } from "@tanstack/react-router";
// import Navbar from "../../components/Common/Navbar";
import { formatDate } from "../../utils";
// import { CloseIcon } from "@chakra-ui/icons";
// import { InfoOutlineIcon,EditIcon } from "@chakra-ui/icons";
import Duplication from '../_layout/duplicationrecodeshow';
// import { useForm } from "react-hook-form"; 


export const Route = createFileRoute("/_layout/haribhagatarecored")({
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
  is_verified: boolean;
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
    const navigate = useNavigate();
    const role = localStorage.getItem("user_role");
  // const [inputValue, setInputValue] = useState("");
  const [searchQuery] = useState("");
  const [currentPage] = useState(1);
  const [limit] = useState(150);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HaribhagatId | null>(null); // State to hold selected item
  // const color = useColorModeValue("#060606", "#c5c5c5");

  const [sort_key, setSortKey] = useState<keyof HaribhagatId>("haribhagat_id");
  const [sort_order, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["hari_bhagat_doublicate", currentPage, searchQuery, limit, sort_key, sort_order],
    queryFn: async () => {
      const response = await ItemsService.getHaribhagtid({
        page: currentPage,
        limit,
        search: searchQuery,
        sort_key,
        sort_order,
        is_verified:'false',
      });
      return response;
    },
    onError: (err) => {
      const errDetail = (err as any).body?.detail;
      showToast("Something went wrong.", errDetail, "error");
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    );
  }

  const items = data?.data.data || [];
  const totalRecords = data?.data.pagination.totalRecords || 0;

  const handleSort = (key: keyof HaribhagatId) => {
    if (sort_key === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };
  const openDuplicationModal = (item: HaribhagatId) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  if (role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  return (
    <Container maxW="full">
      <Flex
        justify={{ base: "center", md: "space-between" }}
        align="center"
        flexDirection={{ base: "column", md: "row" }}
        pt={20}
      >
        <Heading size="lg" textAlign={{ base: "center", md: "left" }}>
          દુબલિકેટ હરિભગત
        </Heading>
      </Flex>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }} mt={{ base: 100, md: 50 }}>
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
            {items
              .filter((item) => !item.is_verified)
              .map((item) => (
                <Tr key={item.haribhagat_id}>
                  <Td>{item.haribhagat_id}</Td>
                  <Td>{`${item.surname} ${item.first_name} ${item.middle_name}`}</Td>
                  <Td>{`${item.mobile_country_code} ${item.mobile}`}</Td>
                  {/* <Td>{item.email}</Td> */}
                  <Td>{formatDate(item.birth_date)}</Td>
                  <Td>
                    <Flex align="center" position="relative"  style={{ display: "flex", gap: "10px" }} >
                      <ActionsMenu type={"Item"} value={item} />
                      <Tooltip label="verified" aria-label="Delete" placement="top">
                        <span>
                        <RiVerifiedBadgeLine
                          onClick={() => openDuplicationModal(item)}
                          size={19}
                          cursor="pointer"
                        />
                        </span>
                        </Tooltip>
                    </Flex>

                  </Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Render the Duplication Modal */}
      {selectedItem && (
        <Duplication
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedItem(null); // Reset the selected item when modal closes
          }}
        />
      )}

      {/* ... Pagination and other components ... */}
    </Container>
  );
}

export default Items;
