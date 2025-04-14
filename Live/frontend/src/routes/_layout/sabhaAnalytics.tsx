import {
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  TableContainer,
  Box,
  useColorModeValue,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Input,
  Button,
  useDisclosure,
  IconButton,
  FormControl,
  FormLabel,
  useToast,
  Icon,
} from "@chakra-ui/react";
import { HiDownload, HiUser } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { serviceSabha } from "../../client";
import { CalendarIcon } from "@chakra-ui/icons";
import { formatDate } from "../../utils";
import { Link } from "@tanstack/react-router";
import AddItem from "../../components/Items/AddItem";
import Sabha from "../../components/Items/Sabha";
import { color } from "framer-motion";

export const Route = createFileRoute("/_layout/sabhaAnalytics")({
  component: sabha,
});

interface SabhaItem {
  sabha_id: string | number;
  sabha_name: string;
  sabha_date: string;
}

function sabha() {
  const toast = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sabhaCount, setSabhaCount] = useState<any[]>([]);
  const [nonAttendees, setNonAttendees] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Color values for light and dark mode
  const containerBgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("inherit", "ui.light");
  const buttonBgColor = useColorModeValue("blue.500", "blue.300"); // for button background

  // Calculate the date range for the last month
  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    // Format the dates to 'yyyy-mm-dd' for the input fields
    const formatDateToInput = (date: Date) => date.toISOString().split("T")[0];

    const initialStartDate = formatDateToInput(lastMonth);
    const initialEndDate = formatDateToInput(today);

    setStartDate(initialStartDate);
    setEndDate(initialEndDate);

    // Call getSabhaCount API only once on initial load
    fetchSabhaCount(initialStartDate, initialEndDate);
  }, []);  // Empty dependency array ensures this effect runs only once

  // Function to fetch Sabha count data
  const fetchSabhaCount = async (start_date: string, end_date: string) => {
    setIsLoading(true);
    try {
      const result = await serviceSabha.getSabhaCount({
        start_date,
        end_date,
      });
      setSabhaCount(result.sabhaCount);
      setNonAttendees(result.nonAttendees);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error fetching Sabha count",
        description: error.message,
        status: "error",
      });
    }
  };

  // Handle date range form submission
  const handleDateSubmit = async () => {
    if (startDate && endDate) {
      fetchSabhaCount(startDate, endDate);
    }
  };
  const handleDownloadPdf = async () => {
    try {
      await serviceSabha.getSabhaCount({
        start_date:startDate,
        end_date:endDate,
        printPdf: true,
        gender: "Female"
      });
    } catch (error) {
      showToast("Error downloading PDF.", error.message, "error");
    }
  };

  const handleDownloadPdfMale = async () => {
    try {
      await serviceSabha.getSabhaCount({
        start_date:startDate,
        end_date:endDate,
        printPdf: true,
        gender: "Male"
      });
    } catch (error) {
      showToast("Error downloading PDF.", error.message, "error");
    }
  };

  const role = localStorage.getItem("user_role");

  return (
    <>
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        <Container maxW="full" bg={containerBgColor}>
          <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12} color={textColor}>
            સભા નુ વિશ્લેષણ
          </Heading>

          {/* Date Filter Section */}
          <Flex
            bg={containerBgColor}
            flexDirection={{ base: "column", md: "row" }} // Stack elements in mobile view
            rounded="lg"
            shadow="lg"
            p={4}
            mb={5}
            alignItems="center"
          >
            <Box mr={{ base: 0, md: 6 }} width={{ base: "100%", md: "auto" }} color={textColor}>
              <FormLabel htmlFor="start-date">Start Date</FormLabel>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="md"
                mb={4}
              />
            </Box>

            <Box mr={{ base: 0, md: 6 }} width={{ base: "100%", md: "auto" }}>
              <FormLabel htmlFor="end-date">End Date</FormLabel>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="md"
                mb={4}
              />
            </Box>

            <Button
              mt={{ base: 2, md: 0 }} // Margin top for mobile to create space
              onClick={handleDateSubmit}
              variant="primary"
              leftIcon={<CalendarIcon />}
              width={{ base: "100%", md: "auto" }} // Ensure the button is full-width in mobile view
              // bg={buttonBgColor}
            >
              Submit
            </Button>

            {role === "admin" && (
              <Box mt={{ base: 4, md: 0 }} width={{ base: "100%", md: "auto" }}>
                <Button
                  variant="primary"
                  gap={1}
                  fontSize={{ base: "sm", md: "inherit" }}
                  onClick={handleDownloadPdfMale}
                  ml={{ base: 0, md: 8 }}
                  // bg={buttonBgColor}
                  width={{ base: "100%", md: "auto" }}
                >
                  <Icon as={HiDownload} /> 
                  પુરૂષ સભા નુ વિશ્લેષણ
                </Button>

                <Button
                  variant="primary"
                  gap={1}
                  fontSize={{ base: "sm", md: "inherit" }}
                  onClick={handleDownloadPdf}
                  ml={{ base: 0, md: 8 }}
                  mt={{ base: 4, md: 0 }}
                  // bg={buttonBgColor}
                  width={{ base: "100%", md: "auto" }}
                >
                  <Icon as={HiDownload} /> મહિલા સભા નુ વિશ્લેષણ 
                </Button>
              </Box>
            )}
          </Flex>

          {/* Sabha Count Table */}
          <TableContainer>
            <Table size={{ base: "sm", md: "md" }} mt={{ base: 5, md: 0 }}>
              <Thead>
                <Tr>
                  <Th>સભા  ({sabhaCount.length})</Th>
                  <Th>ટોટલ હરિભગત</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sabhaCount.map((item, index) => (
                  <Tr key={index}>
                    <Td>{`${sabhaCount.length} થી ${item._id} સભા માં હાજર હોય તેવા`}</Td>
                    <Td>{`${item.haribhagatCount} હરિભાગત `}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Display Non Attendees */}
          <Box mt={4}>
            <Heading size="md" color={textColor}>એક પણ સભા હાજર નો હોય તેવા હરિભાગત: {nonAttendees}</Heading>
          </Box>
        </Container>
      )}
    </>
  );
}

export default sabha;