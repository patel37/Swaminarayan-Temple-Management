import { createFileRoute } from '@tanstack/react-router'
import {
    Button,
    Checkbox,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Box,
    Select
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { dialColdeList } from "../../mockData";
import { Link } from "@tanstack/react-router";

import {
    type ApiError,
    type UserOut,
    type UserUpdate,
    UsersService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern } from "../../utils"

interface EditUserProps {
    user: UserOut
}

interface UserUpdateForm extends UserUpdate {
    confirm_password: string
}

const EditUser = ({ user, }: EditUserProps) => {
    const queryClient = useQueryClient()
    const showToast = useCustomToast()

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting},
    } = useForm<UserUpdateForm>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            ...user,
            password: "",
            confirm_password: "",
        },
    })

    const mutation = useMutation({
        mutationFn: (data: UserUpdateForm) =>
            UsersService.getupdate({ userId: user.id, requestBody: data }),
        onSuccess: () => {
            showToast("Success!", "User updated successfully.", "success")
        },
        onError: (err: ApiError) => {
            const errDetail = (err.body as any)?.detail
            showToast("Something went wrong.", `${errDetail}`, "error")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })

    const onSubmit: SubmitHandler<UserUpdateForm> = async (data) => {
        if (data.password === "") {
          data.password = undefined
        }
        mutation.mutate(data)
      }
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

    return (
        <>
            <Flex
                w="100%"
                alignItems="center"
                justifyContent="center"
                p={{ base: 4, md: 6 }}
                minHeight="100vh"
            //   bg={useColorModeValue("gray.100", "gray.800")}
            >
                <Box
                    w={{ base: "90%", sm: "80%", md: "60%", lg: "50%", xl: "40%" }}
                    maxW="500px"
                    borderRadius="md"
                    // bg={bgxColor}
                    p={6}
                    boxShadow="lg"
                >
                    <fieldset style={{ border: '1px solid', borderRadius: '5px', padding: '16px' }}>
                        <legend style={{ fontWeight: 'bold', fontSize: '18px' }}>Edit </legend>
                        <form  onSubmit={handleSubmit(onSubmit)}>
                            <FormControl isInvalid={!!errors.email}>
                                <FormLabel htmlFor="email">Email</FormLabel>
                                <Input
                                    id="email"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: emailPattern,
                                    })}
                                    placeholder="Email"
                                    type="email"
                                />
                                {errors.email && (
                                    <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                                )}
                            </FormControl>
                            <FormControl mt={4}>
                                <FormLabel htmlFor="name">પૂરું નામ</FormLabel>
                                <Input id="name" {...register("first_name")} type="text" />
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
                            <FormControl mt={4} isInvalid={!!errors.password}>
                                <FormLabel htmlFor="password">Set Password</FormLabel>
                                <Input
                                    id="password"
                                    {...register("password", {
                                        minLength: {
                                            value: 8,
                                            message: "Password must be at least 8 characters",
                                        },
                                    })}
                                    placeholder="Password"
                                    type="password"
                                />
                                {errors.password && (
                                    <FormErrorMessage>{errors.password.message}</FormErrorMessage>
                                )}
                            </FormControl>
                            <FormControl mt={4} isInvalid={!!errors.confirm_password}>
                                <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
                                <Input
                                    id="confirm_password"
                                    {...register("confirm_password", {
                                        validate: (value) =>
                                            value === getValues().password ||
                                            "The passwords do not match",
                                    })}
                                    placeholder="Password"
                                    type="password"
                                />
                                {errors.confirm_password && (
                                    <FormErrorMessage>
                                        {errors.confirm_password.message}
                                    </FormErrorMessage>
                                )}
                            </FormControl>
                            <Flex>
                                <FormControl mt={4}>
                                    <Checkbox {...register("is_superuser")} colorScheme="teal">
                                        Is superuser?
                                    </Checkbox>
                                </FormControl>
                                <FormControl mt={4}>
                                    <Checkbox {...register("is_active")} colorScheme="teal">
                                        Is active?
                                    </Checkbox>
                                </FormControl>
                            </Flex>

                            <Flex justify="flex-end" mt={6}>
                                <Button variant="primary" type="submit" isLoading={isSubmitting} bg="var(--chakra-colors-ui-main)">
                                    Save
                                </Button>
                                <Link to="/admin">
                                    <Button variant="outline" ml={3}>Cancel</Button>
                                </Link>
                            </Flex>
                        </form>
                    </fieldset>
                </Box>
            </Flex>
        </>
    )
}

export default EditUser


export const Route = createFileRoute('/_layout/EditUserpage')({
    component: EditUser
})