import { createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Button,
  ChakraProvider,
  FormLabel,
  FormControl,
  Input,
  FormErrorMessage,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { Link } from "@tanstack/react-router";
import { type ApiError, type ItemSabha, serviceSabha } from "../../client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast";

const MyForm = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const bgColor = useColorModeValue("#f1f8f4", "#555b7d45");
  const color = useColorModeValue("#353434c7", "#fff");
  const buttonColor = useColorModeValue("#fff", "#fff");
  const CancelButton = useColorModeValue("rgb(160 162 162 / 14%)", "rgba(255, 255, 255, 0.08)");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemSabha>({
    mode: "onBlur",
    criteriaMode: "all",

  })

  const mutation = useMutation({
    mutationFn: (data: ItemSabha) =>
      serviceSabha.sabhaItem({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "સભા created successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["hari_bhagat"] });
       window.history.back();
      reset();
      // setIsOpen(false);
     
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.error.message;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
  const onSubmit = (data: ItemSabha) => {
    data.sabha_id = localStorage.getItem("api_key_user") || "";

    mutation.mutate(data);
  };
  return (
    <Flex
      w={{ base: "95%", md: "80%" }}
      alignItems="center"
      justifyContent="center"
      p={{ base: 4, md: 7, lg: 3 }}
      mt={{ base: 8, md: 5, lg: 0 }}
      mb={{ base: 4, md: 5, lg: 8 }}
      position="absolute"
      height={700}

    >
      <Box
        position="relative"
        left={{ base: 0, sm: 5, md: 0 }}
        zIndex={2}
        w={{ base: "100%", md: "190vh", lg: "200vh", xl: "230vh", '2xl': "70vh" }}
        padding="4"
        // borderWidth="1px" 
        borderRadius="md"
        bg={bgColor}

      >
        <fieldset style={{ border: '1px solid', borderRadius: '5px', padding: '16px' }}>
          <legend style={{ fontWeight: 'bold', fontSize: '18px' }}>સભા ઉમેરો</legend>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl isRequired isInvalid={!!errors.sabha_name} mt={4}>
              <FormLabel htmlFor="Sabha Name" fontWeight="bold">
                સભા નું નામ
              </FormLabel>
              <Input
                id="sabha_name"
                {...register("sabha_name", {
                  required: "સભા  is required.",
                })}
                placeholder="સભા  "
                type="text"
                borderColor={color}
              />
              {errors.sabha_name && (
                <FormErrorMessage>{errors.sabha_name.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.sabha_date} mt={7} >
              <FormLabel htmlFor="date" fontWeight="bold">
                તારીખ
              </FormLabel>
              <Input id="sabha_date" type="date" borderColor={color} {...register("sabha_date", {
                required: "તારીખ is required.",

              })} />
              {errors.sabha_date && (
                <FormErrorMessage>{errors.sabha_date.message}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.from_time} mt={7}>
              <FormLabel htmlFor="time" fontWeight="bold">
              ચાલુ થવાના સમય
              </FormLabel>
              <Input id="from_time" type="time" borderColor={color} {...register("from_time", {
                required: "સમય is required.",

              })} />
              {errors.from_time && (
                <FormErrorMessage>{errors.from_time.message}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.to_time} mt={7}>
              <FormLabel htmlFor="time" fontWeight="bold">
              પૂરો થવાના સમય
              </FormLabel>
              <Input id="to_time" type="time" borderColor={color}  {...register("to_time", {
                required: "સમય is required.",

              })} />
              {errors.to_time && (
                <FormErrorMessage>{errors.to_time.message}</FormErrorMessage>
              )}
            </FormControl>
            <Button variant="primary" type="submit" mt={7} isLoading={isSubmitting} bg="var(--chakra-colors-ui-main)" color={buttonColor} >
              Save

            </Button>

            <Link to="/sabhadata">
              <Button variant="primary" bg={CancelButton} mt={7} ml={3}>Cancel</Button>
            </Link>
          </form>
        </fieldset>
      </Box>
    </Flex>

  );
};

const App = () => {
  return (
    <ChakraProvider>
      <Box p={4}>
        <MyForm />
      </Box>
    </ChakraProvider>
  );
};

export default App;
export const Route = createFileRoute('/_layout/sabhaform')({
  component: App,
})