import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  RadioGroup,
  Select,
  Stack,
  Radio
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { dialColdeList } from "../../mockData";

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
  isOpen: boolean
  onClose: () => void
}

interface UserUpdateForm extends UserUpdate {
  confirm_password: string
}

const EditUser = ({ user, isOpen, onClose }: EditUserProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
console.log("---user.role",user.role)
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...user,
      is_active: user.status ==='Active' ? true: false ,
      is_superuser: user.role,
      password: "", 
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateForm) =>
      UsersService.updateUser({ userId: user.id, requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success")
      onClose()
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

  const onCancel = () => {
    reset()
    onClose()
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
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
            <FormControl isRequired isInvalid={!!errors.is_superuser} mt={4}>
                            <FormLabel htmlFor="User Category" >User Category</FormLabel>
                            {/* <RadioGroup {...register("is_superuser")} value={user.role} colorScheme="teal">
                                <Stack direction="row">
                                <Radio value="admin">Admin</Radio>
                                <Radio value="user">User</Radio>
                                <Radio value="sub-user">Sub-user</Radio>
                                </Stack>
                            </RadioGroup> */}
                            </FormControl>
                            <Controller
                              control={control}
                              name="role"
                              render={({ field }) => (
                                <RadioGroup {...field}>
                                  <Stack direction="row">
                                    <Radio value="admin">Admin</Radio>
                                  <Radio value="user">User</Radio>
                                  <Radio value="sub-user">Sub-user</Radio>
                                  </Stack>
                                </RadioGroup>
                              )}
                            />
                        
                             <FormControl  mt={4}>
                                <FormLabel htmlFor="is_active" fontWeight="bold">Status</FormLabel>
                                <Checkbox {...register("is_active")} colorScheme="teal">
                                  Is active?
                                </Checkbox>
                            </FormControl>
            {/* <Flex>
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
            </Flex> */}
          </ModalBody>

          <ModalFooter gap={3}>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={!isDirty}
            >
              Save
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default EditUser
