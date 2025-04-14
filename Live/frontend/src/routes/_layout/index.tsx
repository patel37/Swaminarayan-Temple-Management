import {
  Box,
  Container,
  Text,
  Link,
  Grid,
  GridItem,
  Heading,
  Flex,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { DashboardService } from "../../client";
import { useQuery } from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast";
import { useNavigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  const showToast = useCustomToast();
    const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard_count"],
    queryFn: () => DashboardService.getCount(),
  });

  if (isError) {
    const errDetail = (error as any).body?.detail;
    showToast("Something went wrong.", `${errDetail}`, "error");
  }
  const role = localStorage.getItem("user_role");
  if (role === "sub-user") {
    navigate({ to: "/Attendance" });
    return null;
  }
  if (role === "user") {
    navigate({ to: "/addViewitem" });
    return null;
  }

  return (
    <>
      <Container maxW="full">
        <Box pt={12} m={4}>
          <Text fontSize="2xl">
            જય સ્વામિનારાયણ👋🏼
          </Text>
          {/* <Text> તમને ફરી જોઈને આનંદ થયો!</Text> */}

          {isLoading ? (
            <Flex justify="center" align="center" height="100vh" width="full">
              <Spinner size="xl" color="ui.main" />
            </Flex>
          ) : (
            dashboard && (
              <Grid
                templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(4, 1fr)" }}
                gap={6}
                mt={8}
              >
                <DashboardCard
                  title="કુલ હરિભગત"
                  value={dashboard.data?.total_haribhagat?.valueOf() || 0}
                  link="/haribhagat"
                  underlineOnHover={false}
                />
                <DashboardCard
                  title="હરિભગતો ના કુલ પરિવારના સભ્યો"
                  value={dashboard.data?.total_family_members?.valueOf() || 0}
                />
                <DashboardCard
                  title="માસિક દાન દેવાવાળા હરિભક્તો"
                  value={dashboard.data?.total_monthly_donated?.valueOf() || 0}
                  link="/monthly-donor"
                  underlineOnHover={false}
                />
                <DashboardCard
                  title="આગામી સપ્તાહમાં જન્મદિવસ આવતા હરિભક્તો"
                  value={dashboard.data?.upcoming_birthdays?.valueOf() || 0}
                  link="/birthday-list"
                  underlineOnHover={false}
                />
                <DashboardCard
                  title="કુલ સભા"
                  value={dashboard.data?.total_sabha?.valueOf() || 0}
                  link="/sabhadata"
                  underlineOnHover={false}
                />
                <DashboardCard
                  title="છેલ્લી સભા માં હાજર હરિભાગતો"
                  link={`/Attendance?sabha_id=${dashboard.data?.last_sabha_id?.valueOf() || 0}&only_present=true`}
                  value={dashboard.data?.last_sabha_attendees?.valueOf() || 0}
                  underlineOnHover={false}
                />

               {/* <DashboardCard
                  title="છેલ્લી સભા માં હાજર ન હોય પરંતુ ચાલુ સભા આવેલા હરિભાગતો "
                  link={`/Attendance?sabha_id=last_sabha_not_present&only_present=true`}
                  value={dashboard.data?.new_attendees_count?.valueOf() || 0}
                  underlineOnHover={false}
                /> */}
              </Grid>
            )
          )}
        </Box>
      </Container>
    </>
  );
}

const DashboardCard = ({
  title,
  value,
  link,
  underlineOnHover = true,
}: {
  title: string;
  value: number;
  link?: string;
  underlineOnHover?: boolean;
}) => {
  const bg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <GridItem colSpan={{ base: 1, md: 1 / 4 }}>
      {link ? (
        <Link as={RouterLink} to={link} textDecoration={underlineOnHover ? "underline" : "none"}>
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            bg={bg}
            _hover={{ bg: hoverBg, textDecoration: "none" }}
            cursor="pointer"
          >
            <Flex justifyContent="space-between" alignItems="center">
              <Heading as="h3" size="sm">
                {title}
              </Heading>
            </Flex>
            <Text mt={2} fontSize="2xl">
              {value}
            </Text>
          </Box>
        </Link>
      ) : (
        <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg={bg}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading as="h3" size="sm">
              {title}
            </Heading>
          </Flex>
          <Text mt={2} fontSize="2xl">
            {value}
          </Text>
        </Box>
      )}
    </GridItem>
  );
};

export default Dashboard;
