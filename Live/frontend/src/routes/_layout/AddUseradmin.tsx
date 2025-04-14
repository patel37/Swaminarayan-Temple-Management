import { createFileRoute } from '@tanstack/react-router';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Select,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type UserCreate, UsersService } from "../../client";
import type { ApiError } from "../../client/core/ApiError";
import useCustomToast from "../../hooks/useCustomToast";
import { emailPattern } from "../../utils";
import { dialColdeList } from "../../mockData";

interface AddUserProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserCreateForm extends UserCreate {
  confirm_password: string;
}

const AddUser = ({}: AddUserProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const bgColor = useColorModeValue("#f1f8f4", "#555b7d45");
  const buttonColor = useColorModeValue("#fff", "#fff");
  const cancelButtonColor = useColorModeValue("rgb(160 162 162 / 14%)", "rgba(255, 255, 255, 0.08)");

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      first_name: "",
      password: "",
      confirm_password: "",
      is_superuser: false,
      is_active: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserCreateForm) => UsersService.createUser({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User created successfully.", "success");
      reset();
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail || "An unknown error occurred.";
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
  const validateMobile = (value: string) => {
        const englishDigitsRegex = /^[0-9]*$/; 
        if (englishDigitsRegex.test(value)) {
          const formData = getValues();
          // If mobile_country_code is +91, then validate for 10 digits
          if (formData.mobile_country_code === '+91') {
            return value.length === 10 || 'Mobile number must be 10 digits long.';
          }
          // If mobile_country_code is not +91, no validation needed
          return true;
        } else {
          // If value contains non-English digits, return error message
          return 'Only English digits are allowed in the mobile number.';
        }
      };

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Flex
      w="100%"
      alignItems="center"
      justifyContent="center"
      p={{ base: 4, md: 6 }}
      minHeight="100vh"
      bg={useColorModeValue("gray.100", "gray.800")}
    >
      <Box
        w={{ base: "90%", sm: "80%", md: "60%", lg: "50%", xl: "40%" }}
        maxW="500px"
        borderRadius="md"
        bg={bgColor}
        p={6}
        boxShadow="lg"
      >
        <fieldset style={{ border: '1px solid', borderRadius: '5px', padding: '16px' }}>
          <legend style={{ fontWeight: 'bold', fontSize: '18px' }}>Add User</legend>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl isRequired isInvalid={!!errors.email} mt={4}>
              <FormLabel htmlFor="email" fontWeight="bold">Email</FormLabel>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
              />
              {errors.email && <FormErrorMessage>{errors.email.message}</FormErrorMessage>}
            </FormControl>

            <FormControl mt={4} isInvalid={!!errors.first_name}>
              <FormLabel htmlFor="first_name" fontWeight="bold">પૂરું નામ</FormLabel>
              <Input
                id="first_name"
                {...register("first_name")}
                placeholder="પૂરું નામ"
                type="text"
              />
              {errors.first_name && <FormErrorMessage>{errors.first_name.message}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.mobile_country_code} mt={4}>
              <FormLabel htmlFor="mobile_country_code" fontWeight="bold">ડાયલ કોડ</FormLabel>
              <Select {...register("mobile_country_code")}>
                {dialColdeList.map((country, index) => (
                  <option key={index} value={country.dial_code}>
                    {`${country.dial_code} ${country.name}`}
                  </option>
                ))}
              </Select>
              {errors.mobile_country_code && <FormErrorMessage>{errors.mobile_country_code.message}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.mobile} mt={4}>
              <FormLabel htmlFor="mobile" fontWeight="bold">મોબાઈલ નંબર</FormLabel>
              <Input
                id="mobile"
                {...register("mobile", {
                  required: "મોબાઈલ નંબર is required.",
                  validate: validateMobile,
                })}
                placeholder="મોબાઈલ નંબર"
                type="text"
              />
              {errors.mobile && <FormErrorMessage>{errors.mobile.message}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.password} mt={4}>
              <FormLabel htmlFor="password" fontWeight="bold">Set Password</FormLabel>
              <Input
                id="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                placeholder="Password"
                type="password"
              />
              {errors.password && <FormErrorMessage>{errors.password.message}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.confirm_password} mt={4}>
              <FormLabel htmlFor="confirm_password" fontWeight="bold">Confirm Password</FormLabel>
              <Input
                id="confirm_password"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues().password || "The passwords do not match",
                })}
                placeholder="Confirm Password"
                type="password"
              />
              {errors.confirm_password && <FormErrorMessage>{errors.confirm_password.message}</FormErrorMessage>}
            </FormControl>

            {/* <Flex mt={4}> */}
              {/* <FormControl>
                <Checkbox {...register("is_superuser")} colorScheme="teal">Is superuser?</Checkbox>
              </FormControl> */}
              <FormControl isRequired isInvalid={!!errors.confirm_password} mt={4}>
                <FormLabel htmlFor="User Category" fontWeight="bold">User Category</FormLabel>
                  <RadioGroup {...register("is_superuser")} colorScheme="teal">
                    <Stack direction="row">
                      <Radio value="admin">Admin</Radio>
                      <Radio value="user">User</Radio>
                      <Radio value="sub-user">Sub-user</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
             
              <FormControl isRequired isInvalid={!!errors.confirm_password} mt={4}>
                <FormLabel htmlFor="is_active" fontWeight="bold">Status</FormLabel>
                <Checkbox {...register("is_active")} colorScheme="teal">Is active?</Checkbox>
                </FormControl>
              <FormControl>

              
              </FormControl>
            {/* </Flex> */}

            <Flex justify="flex-end" mt={6}>
              <Button variant="primary" type="submit" isLoading={isSubmitting} bg="var(--chakra-colors-ui-main)">
                Save
              </Button>
              <Link to="/admin">
                <Button variant="outline" bg={cancelButtonColor} ml={3}>Cancel</Button>
              </Link>
            </Flex>
          </form>
        </fieldset>
      </Box>
    </Flex>
  );
};

export default AddUser;

export const Route = createFileRoute('/_layout/AddUseradmin')({
  component: AddUser,
});
