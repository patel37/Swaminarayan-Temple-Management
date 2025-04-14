import {
  Center,
  Button,
  Text,
  Heading,
  Image,
  Stack,
  Box,
  HStack,
  Icon,
  useColorModeValue,
  Flex,

  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { FaHome, FaPhone, FaEnvelope, FaBirthdayCake, FaUserFriends } from "react-icons/fa";
import type { ItemOut, UserOut } from "../../client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ItemsService } from "../../client";
import { formatDate } from "../../utils";
import { useNavigate } from '@tanstack/react-router';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';


interface ViewItemProps {
  item: ItemOut;
  value: ItemOut | UserOut;
  onClose: () => void;
}
interface ApiResponse {
  data: {
    data: ItemOut;
  };
}

const ViewItem = () => {
  const styleCont = {
    m: 0,
  };

  const haribhagatId = new URLSearchParams(window.location.search).get('haribhagat_id');
  // const location = useLocation();
  const navigate = useNavigate();
  console.log("haribhgat_id",haribhagatId)

  const { data } = useQuery<ApiResponse | null>({
    queryKey: ["hari_bhagat", haribhagatId],
    queryFn: async () => {
      if (haribhagatId) {
        const response = await ItemsService.getHaribhagatDetailByID({ haribhagat_id: haribhagatId });
        return response;
      }
      return null;
    },
  });

  const haribhagatDetails = data?.data || {};
  // console.log("haribhagtdata",haribhagatDetails)
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const buttonColor = useColorModeValue("#fff", "#fff");
  const labelColor = useColorModeValue("#000", "#fff")
  const backgroundGradient = useColorModeValue(
    "linearto right, #acd4d0, #79acdb",
    // "linear(to-r,  #acd4d0, #79acdb)",
    "linear(to-r, #000000ba,#00000024)",
  );
  // const navigate = useNavigate();

  const handleBack = () => {
    window.history.back();
  };
  const attendedSabhas = Array.isArray(haribhagatDetails?.attended_sabhas)
    ? haribhagatDetails.attended_sabhas.length // Use the array length
    : 0;
  const totalSabhas = Number(haribhagatDetails?.total_sabha_count || 0);
  const remainingSabhas = totalSabhas - attendedSabhas;

  const pieChartData = {
    datasets: [
      {
        data: [attendedSabhas, remainingSabhas],
        backgroundColor: ['#2ab935', '#ca2e2e'],
        hoverBackgroundColor: ['#2ab935', '#ca2e2e'],
        borderWidth: 1.5,
      },
    ],
    labels: [`હાજર દિવસ : ${attendedSabhas}`, `ગેરહાજર દિવસ : ${remainingSabhas}`],
  };
  const pieChartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const value = tooltipItem.raw;
            return `${tooltipItem.label}: (${((value / totalSabhas) * 100).toFixed(1)}%)`;
          },
        },
      },
      legend: {
        position: 'top',
        labels: {
          color: labelColor, // Label color
          usePointStyle: true,
          font: {
            size: 13,        // Font size
            family: 'Arial', // Font family
            weight: 'bold',  // Font weight
          },
          padding: 20,
        },
      },
    },
    cutout: '0%', // Makes the pie chart look like a donut
    rotation: -0, // Rotates the chart to start from the top
  };
  console.log("pie chart", pieChartData)
  console.log("data", haribhagatDetails)

  return (
    <Flex
      w="100%"
      minH="100vh"
      alignItems="flex-start" // Align content to the top
      justifyContent="center"
      p={[4, 6, 8]} // Mobile: 4, Tablet: 6, Desktop: 8
      bg={useColorModeValue("gray.100", "gray.800")}
      position="relative"
      flexDirection="column"
    >
      {/* Content Box with Heading at the Top */}
      <Box
        w="100%"
        maxW={["100%", "90%", "800px"]} // Mobile: 100%, Tablet: 90%, Desktop: 800px
        mx="auto"
        p={[6, 8, 10]} // Mobile: 6, Tablet: 8, Desktop: 10
        border="1px solid"
        borderColor={cardBorderColor}
        borderRadius="md"
        boxShadow="lg"
        bg={cardBg}
        bgGradient={backgroundGradient}
        zIndex={1}
        flexDirection="column"
      >
        <Box
          position="absolute"
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

        {/* Heading - Stays at the top for all views */}
        <Box
          w="100%"
          textAlign="center"
          mb={[4, 6, 8]} // Mobile: 4, Tablet: 6, Desktop: 8
        >
          <Heading size="lg" color={textColor}>
            હરિભગત
          </Heading>
        </Box>

        <Flex
          direction={["column", "column", "row"]} // Mobile & Tablet: column, Desktop: row
          justifyContent="center"
          alignItems="center"
        >
          <Center
            flex="1"
            flexDirection="column"
            mb={[4, 6, 8]} // Mobile: 4, Tablet: 6, Desktop: 8
          >
            <Image
              src={haribhagatDetails.profile_picture}
              alt="Mandir Logo"
              boxSize={["fit-content"]} // Mobile: 100px, Tablet: 150px, Desktop: 300px
              objectFit="cover"
              borderRadius="15"
              boxShadow="md"
              maxHeight={"250px"}
            />
            <Box mt={8}  width="100%" textAlign="center">
              <Heading mb={3}  size="sl" color={textColor}>
                હરિભગત ની હાજરી
              </Heading>
              <Pie data={pieChartData} options={pieChartOptions} />
              {/* <Text {...styleCont}>{attendedSabhas}</Text> */}

            </Box>
          </Center>

          <Box flex="1" ml={[0, 4, 8]} textAlign="left">
            <Stack mt={4} spacing={5}>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="teal.400" />
                <Text {...styleCont} mt={0}>
                  <Text mr={1} as="span" fontWeight="bold">
                    ID :
                  </Text>
                  {haribhagatDetails.haribhagat_id}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="teal.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    પુરુ નામ :
                  </Text>
                  {haribhagatDetails.surname} {haribhagatDetails.first_name} {haribhagatDetails.middle_name}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="pink.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    લિંગ :
                  </Text>
                  {haribhagatDetails.gender}
                </Text>
              </HStack>
              <HStack spacing={2}>
              <Icon as={FaHome} color="yellow.400" />
              <Text {...styleCont}>
                <Text as="span" fontWeight="bold">સરનામું : </Text>
                {haribhagatDetails.house_no && `${haribhagatDetails.house_no}, `}
                {haribhagatDetails.address && `${haribhagatDetails.address}, `}
                {haribhagatDetails.landmark && `${haribhagatDetails.landmark}, `}
                {haribhagatDetails.area && `${haribhagatDetails.area}, `}
                {haribhagatDetails.district && `${haribhagatDetails.district}, `}
                {haribhagatDetails.sub_district && `${haribhagatDetails.sub_district}, `}
                {haribhagatDetails.state && `${haribhagatDetails.state}, `}
                {haribhagatDetails.pin_code && haribhagatDetails.pin_code}
              </Text>
            </HStack>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="pink.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    મૂળ વતન :
                  </Text>
                  {haribhagatDetails.native_place}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaPhone} color="blue.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    મોબાઈલ નંબર :
                  </Text>
                  {haribhagatDetails.mobile}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="teal.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    વ્યવસાય :
                  </Text>
                  {haribhagatDetails.business_name}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaHome} color="green.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    પોતા નું ઘર છે? :
                  </Text>
                  {haribhagatDetails.is_own_home ? "હા" : "ના"}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="red.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    ભૂમિ દાતાશ્રી :
                  </Text>
                  {haribhagatDetails.is_memeber_of_land_donation ? "હા" : "ના"}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="red.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    અન્ય દાતાશ્રી:
                  </Text>
                  {haribhagatDetails.is_member_of_other_donation ? "હા" : "ના"}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="red.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    સહજાનંદી સભા ના સભ્ય છે? :
                  </Text>
                  {haribhagatDetails.is_memeber_of_sahajanadi_sabha ? "હા" : "ના"}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Icon as={FaBirthdayCake} color="orange.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    જન્મ તારીખ :
                  </Text>
                  {formatDate(haribhagatDetails.birth_date)}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaBirthdayCake} color="pink.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    લગ્ન ની તારીખ :
                  </Text>
                  {formatDate(haribhagatDetails.anniversary_date)}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaUserFriends} color="cyan.400" />
                <Text {...styleCont}>
                  <Text mr={1} as="span" fontWeight="bold">
                    ઘર ના કુલ સભ્ય :
                  </Text>
                  {`${haribhagatDetails.number_of_family_member}`}
                </Text>
              </HStack>
            </Stack>
            {Array.isArray(haribhagatDetails?.attended_sabhas) && (
                <Link to={`/haribhagaeview?haribhagt_id=${haribhagatDetails.haribhagat_id}`}>
              <Box mt={4} p={0} borderRadius="md" textAlign="left" w="80%">
                <Icon as={FaUserFriends} color="cyan.400" />
                <Heading as="span" ml={2} size="sm" mb={3} color={textColor}>
                  સભા માં હાજર રહિયા :
                </Heading>
                    <Text  {...styleCont}>
                      <Text mr={1} ml={6} as="span" fontWeight="bold">
                        કુલ સભા :
                      </Text>
                      {`${haribhagatDetails.total_sabha_count}`}
                    </Text>
                    <Text {...styleCont}>
                      <Text mr={1} ml={6} as="span" fontWeight="bold">
                        હાજર દિવસ :
                      </Text>
                      {`${haribhagatDetails.attended_sabhas.length}`}
                    </Text>
                    <Text {...styleCont}>
                      <Text mr={1} ml={6} as="span" fontWeight="bold">
                        ગેરહાજર દિવસ :
                      </Text>
                      {`${remainingSabhas}`}
                    </Text>
              </Box>
                </Link>
            )}
          </Box>
        </Flex>
      </Box>
    </Flex>
  );

};

export default ViewItem;

export const Route = createFileRoute("/_layout/viewharibhagatpage")({
  component: ViewItem,
});
