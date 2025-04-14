import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_layout/AttendanceView")({
  component: SabhaPieChart,
});
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { serviceSabha } from "../../client";
import { Box, Heading,Text, useColorModeValue } from "@chakra-ui/react";
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";

const sabhaId = new URLSearchParams(window.location.search).get('sabha_id');
console.log("sabhaId",sabhaId)
// Register required chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function SabhaPieChart() {
  const color = useColorModeValue("#060606", "#c5c5c5");
  const [sabhaId, setSabhaId] = useState(new URLSearchParams(window.location.search).get('sabha_id'));

  // Fetch Sabha Data based on sabhaId
  const { data: apiResponse, isLoading, isError, error } = useQuery({
    queryKey: ["haribhagat_sabha"],
    queryFn: () => serviceSabha.readSabha(),
  }
  );

  useEffect(() => {
    // Update sabhaId when the URL changes
    setSabhaId(new URLSearchParams(location.search).get('sabha_id'));
  }, [location.search]); // Re-run the effect when the URL changes

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error: {(error as any)?.message}</p>;
  }

  // Extract analysis data from API response
  const sabhaData = apiResponse?.data?.analysis?.find(
    (sabha) => sabha.sabha_id === sabhaId
  ) || {};
  console.log("sabhadata",sabhaData)
  const {
    totalHaribhagats = 0,
    totalPresent = 0,
    totalAbsent = 0,
    attendeesInBothSabhas = [], // Extract attendees in both sabhas
  } = sabhaData;

  // Prepare pie chart data
  const pieData = [
    { name: "Total Present", value: totalPresent },
    { name: "Total Absent", value: totalAbsent },
    { name: "Attended in Last 2 Sabhas", value: attendeesInBothSabhas.length }, // Add new category for attendees in both sabhas
  ];

  const data = {
    labels: pieData.map((entry) => entry.name),
    datasets: [
      {
        data: pieData.map((entry) => entry.value),
        backgroundColor: ["#4CAF50", "#FF5733", "#FFC107"], // Added color for the new category
        hoverBackgroundColor: ["#45D75B", "#FF7960", "#FFB84D"], // Added hover color for the new category
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: color,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.label}: ${context.raw} (${((context.raw / totalHaribhagats) * 100).toFixed(2)}%)`,
        },
      },
    },
  };

  return (
    <Box p={5}>
      <Heading maxW="100%" size="lg" textAlign="center" color={color} mb={5}>
        Haribhagat Attendance Analysis: {sabhaId}
      </Heading>
      <Box ml="5%" mb={5}>
        <Pie data={data} options={options} />
      </Box>
      <Text textAlign="center" color={color} mb={2}>
        Total Haribhagats: {totalHaribhagats}
      </Text>
      <Text textAlign="center" color={color}>
        Attended in Last 2 Sabhas: {attendeesInBothSabhas.length}
      </Text>
    </Box>
  );
}

export default SabhaPieChart;
