import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  type Interpolation,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Flex,
  Image,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { dateConvert, scrollbarStyles } from "../../utils"

import React,{useState} from "react"
import {
  type ApiError,
  type ItemOut,
  type ItemUpdate,
  ItemsService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

interface EditItemProps {
  item: ItemOut
  isOpen: boolean
  onClose: () => void
}

const EditItem = ({ item, isOpen, onClose }: EditItemProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const btnRef = React.useRef(null)
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {

    const files = event.target.files;
  
    if (!files || files.length === 0) {
      // Handle case where no file is selected
      return;
    }
    const maxSizeInBytes: number = 1 * 1024 * 1024; // 2MB
    const file: File = files[0];
  
    if (file.size > maxSizeInBytes) {
      // Display an error message or handle the oversized image
      showToast("Something went wrong.", "Image size exceeds the maximum allowed size (1MB). Please choose a smaller image", "error");
      setProfileImage(null);
      setValue("profile_picture_base63", null, { shouldDirty: true });
      return;
    }
    setProfileImage(file);
    setValue("profile_picture_base63", '', { shouldDirty: true });
  };
 
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ItemUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...item,
      birth_date: dateConvert(item.birth_date),
      anniversary_date: dateConvert(item.anniversary_date),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      ItemsService.updateItem({
        haribhagat_id: item.haribhagat_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showToast("Success!", "Item updated successfully.", "success")
      setProfileImage(null);
      queryClient.invalidateQueries({ queryKey: ["hari_bhagat"] })
      onClose()
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

    const validateMobile = (value: string) => {
      const englishDigitsRegex = /^[0-9]*$/; // Regex to match only English digits
  
        // If value contains only English digits, return true
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

  const onSubmit: SubmitHandler<ItemUpdate> = async (data) => {
    data.number_of_family_member =
      typeof data.number_of_family_member !== "number"
        ? Number.parseInt(`${data.number_of_family_member}`)
        : data.number_of_family_member
    let imageData: string | null = null;
  if (profileImage) {
    const reader = new FileReader();
    reader.readAsDataURL(profileImage);
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        imageData = reader.result.split(",")[1];
        const maxSizeInBytes = 1 * 1024 * 1024; // 5MB
        if (profileImage.size <= maxSizeInBytes) {
          // Include the image data in your JSON object
          data.profile_picture_base63 = imageData;
          // Submit the JSON data
          mutation.mutate(data);
        } else {
          // Display an error message or handle the oversized image
          alert("Image size exceeds the maximum allowed size (1MB). Please choose a smaller image.");
          return;
        }
      }
    };
  } else {
    // If no profile image, simply submit the form data
    mutation.mutate(data);
  }
  }
  const onCancel = () => {
    setProfileImage(null);
    reset()
    onClose()
  }
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={()=>{setProfileImage(null),onClose()}}
        // size={{ base: "sm", md: "md" }}
        finalFocusRef={btnRef}
        scrollBehavior={"inside"}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>હરિભગતને સંપાદિત કરો</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} css={scrollbarStyles as Interpolation<{}>}>
            <FormLabel htmlFor="નામ" fontWeight="bold">
              નામ
            </FormLabel>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              padding="15px"
              paddingTop="0px"
            >
              <FormControl isRequired isInvalid={!!errors.surname} mt={4}>
                <FormLabel htmlFor="surname" fontWeight="bold">
                  અટક
                </FormLabel>
                <Input
                  id="surname"
                  {...register("surname", {
                    required: "અટક is required.",
                  })}
                  placeholder="અટક "
                  type="text"
                />
                {errors.surname && (
                  <FormErrorMessage>{errors.surname.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.first_name} mt={4}>
                <FormLabel htmlFor="first_name" fontWeight="bold">
                  પોતા નું નામ
                </FormLabel>
                <Input
                  id="first_name"
                  {...register("first_name", {
                    required: "પોતા નું નામ is required.",
                  })}
                  placeholder="પોતા નું નામ"
                  type="text"
                />
                {errors.first_name && (
                  <FormErrorMessage>
                    {errors.first_name.message}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.middle_name} mt={4}>
                <FormLabel htmlFor="middle_name" fontWeight="bold">
                  પિતા / પતિ   નું નામ
                </FormLabel>
                <Input
                  id="middle_name"
                  {...register("middle_name", {
                    required: "પિતા / પતિ   નું નામ is required.",
                  })}
                  placeholder="પિતા / પતિ   નું નામ"
                  type="text"
                />
                {errors.middle_name && (
                  <FormErrorMessage>
                    {errors.middle_name.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.gender} mt={4}>
                <FormLabel htmlFor="gender" fontWeight="bold">
                  લિંગ
                </FormLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Stack direction="row">
                        <Radio value="Male">પુરુષ</Radio>
                        <Radio value="Female">સ્ત્રી</Radio>
                        <Radio value="Transgender">અન્ય</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />

                {errors.gender && (
                  <FormErrorMessage>{errors.gender.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.birth_date} mt={4}>
                <FormLabel htmlFor="birth_date" fontWeight="bold">
                  જન્મ તારીખ{" "}
                </FormLabel>
                <Input
                  id="birth_date"
                  {...register("birth_date", {
                    required: "Birthdate is required.",
                  })}
                  placeholder="Select birthdate"
                  type="date"
                />
                {errors.birth_date && (
                  <FormErrorMessage>
                    {errors.birth_date.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.anniversary_date} mt={4}>
                <FormLabel htmlFor="anniversary_date" fontWeight="bold">
                  {" "}
                  લગ્ન ની તારીખ
                </FormLabel>
                <Input
                  id="anniversary_date"
                  {...register("anniversary_date")}
                  placeholder="Select birthdate"
                  type="date"
                />
                {errors.anniversary_date && (
                  <FormErrorMessage>
                    {errors.anniversary_date.message}
                  </FormErrorMessage>
                )}
              </FormControl>
            </Box>

            {/* </Flex> */}

            <FormLabel htmlFor="નામ" fontWeight="bold" paddingTop="10px">
              કોન્ટેક્ટ ની માહિતી
            </FormLabel>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              padding="15px"
              paddingTop="0px"
            >
              <FormControl
                isRequired
                isInvalid={!!errors.mobile_country_code}
                mt={4}
              >
                <FormLabel htmlFor="mobile_country_code" fontWeight="bold">
                  ડાયલ કોડ
                </FormLabel>
                <Input
                  id="mobile_country_code"
                  {...register("mobile_country_code", {
                    required: "ડાયલ કોડ is required.",
                    value: "+91",
                  })}
                  placeholder="ડાયલ કોડ"
                  type="text"
                />
                {errors.mobile_country_code && (
                  <FormErrorMessage>
                    {errors.mobile_country_code.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.mobile} mt={4}>
                <FormLabel htmlFor="mobile" fontWeight="bold">
                  મોબાઈલ નંબર
                </FormLabel>
                <Input
                  id="mobile"
                  {...register("mobile", {
                    required: "મોબાઈલ નંબર is required.",
                    validate: validateMobile 
                  })}
                  placeholder="મોબાઈલ નંબર"
                  type="text"
                />
                {errors.mobile && (
                  <FormErrorMessage>{errors.mobile.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.business_name} mt={4}>
                <FormLabel htmlFor="business_name" fontWeight="bold">
                વ્યવસાય
                </FormLabel>
                <Input
                  id="business_name"
                  {...register("business_name", {
                    required: "વ્યવસાય is required.",
                  })}
                  placeholder="વ્યવસાય"
                  type="text"
                />
                {errors.business_name && (
                  <FormErrorMessage>
                    {errors.business_name.message}
                  </FormErrorMessage>
                )}
              </FormControl>


              <FormControl isRequired isInvalid={!!errors.native_place} mt={4}>
                <FormLabel htmlFor="native_place" fontWeight="bold">
                મૂળ વતન
                </FormLabel>
                <Input
                  id="native_place"
                  {...register("native_place", {
                    required: " મૂળ વતન is required.",
                  })}
                  placeholder="મૂળ વતન"
                  type="text"
                />
                {errors.native_place && (
                  <FormErrorMessage>
                    {errors.native_place.message}
                  </FormErrorMessage>
                )}
              </FormControl>

            </Box>
            <FormLabel htmlFor="નામ" fontWeight="bold" paddingTop="10px">
              સરનામું{" "}
            </FormLabel>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              padding="15px"
              paddingTop="0px"
            >
              <FormControl isInvalid={!!errors.house_no} mt={4}>
                <FormLabel htmlFor="house_no" fontWeight="bold">
                  ઘર નંબર
                </FormLabel>
                <Input
                  id="house_no"
                  {...register("house_no")}
                  placeholder="ઘર નંબર"
                  type="text"
                />
                {errors.house_no && (
                  <FormErrorMessage>{errors.house_no.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.address} mt={4}>
                <FormLabel htmlFor="address" fontWeight="bold">
                  સોસાયટી / ફ્લેટ / મકાન નું નામ{" "}
                </FormLabel>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="સોસાયટી / ફ્લેટ / મકાન નું નામ"
                  type="text"
                />
                {errors.address && (
                  <FormErrorMessage>{errors.address.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isInvalid={!!errors.landmark} mt={4}>
                <FormLabel htmlFor="landmark" fontWeight="bold">
                  નજીક નું જાણીતું સ્થાન{" "}
                </FormLabel>
                <Input
                  id="landmark"
                  {...register("landmark")}
                  placeholder="નજીક નું જાણીતું સ્થાન"
                  type="text"
                />
                {errors.landmark && (
                  <FormErrorMessage>{errors.landmark.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.district} mt={4}>
                <FormLabel htmlFor="district" fontWeight="bold">
                  જિલ્લો
                </FormLabel>
                <Input
                  id="district"
                  {...register("district", {
                    required: "જિલ્લો is required.",
                  })}
                  placeholder="જિલ્લો"
                  type="text"
                />
                {errors.district && (
                  <FormErrorMessage>{errors.district.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.sub_district} mt={4}>
                <FormLabel htmlFor="sub_district" fontWeight="bold">
                  તાલુકા
                </FormLabel>
                <Input
                  id="sub_district"
                  {...register("sub_district", {
                    required: "તાલુકા is required.",
                  })}
                  placeholder="તાલુકા"
                  type="text"
                />
                {errors.sub_district && (
                  <FormErrorMessage>
                    {errors.sub_district.message}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.state} mt={4}>
                <FormLabel htmlFor="state" fontWeight="bold">
                  રાજ્ય
                </FormLabel>
                <Input
                  id="state"
                  {...register("state", {
                    required: "રાજ્ય is required.",
                  })}
                  placeholder="રાજ્ય"
                  type="text"
                />
                {errors.state && (
                  <FormErrorMessage>{errors.state.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.pin_code} mt={4}>
                <FormLabel htmlFor="pin_code" fontWeight="bold">
                  પિન કોડ
                </FormLabel>
                <Input
                  id="pin_code"
                  {...register("pin_code")}
                  placeholder="પિન કોડ"
                  type="text"
                />
                {errors.pin_code && (
                  <FormErrorMessage>{errors.pin_code.message}</FormErrorMessage>
                )}
              </FormControl>
            </Box>
            <FormControl isInvalid={!!errors.is_own_home} paddingTop="10px">
              <FormLabel htmlFor="is_own_home" fontWeight="bold">
                પોતા નું ઘર છે ?
              </FormLabel>

              <RadioGroup
                defaultValue={`${item.is_own_home}`}
                onChange={(value) => setValue("is_own_home", value === "true",  { shouldDirty: true })}
              >
                <Stack direction="row">
                  <Radio value="true">હા</Radio>
                  <Radio value="false">ના</Radio>
                </Stack>
              </RadioGroup>

              {errors.is_own_home && (
                <FormErrorMessage>
                  {errors.is_own_home.message}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.note} paddingTop="10px">
              <FormLabel
                htmlFor="is_memeber_of_land_donation"
                fontWeight="bold"
              >
               ભૂમિ દાનના દાતા છે?
              </FormLabel>
              <RadioGroup
                defaultValue={`${item.is_memeber_of_land_donation}`}
                onChange={(value) =>
                  setValue("is_memeber_of_land_donation", value === "true",  { shouldDirty: true })
                }
              >
                <Stack direction="row">
                  <Radio value={`${true}`}>હા</Radio>
                  <Radio value={`${false}`}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_memeber_of_land_donation && (
                <FormErrorMessage>
                  {errors.is_memeber_of_land_donation.message}
                </FormErrorMessage>
              )}
            </FormControl>


            <FormControl isInvalid={!!errors.note} paddingTop="10px">
              <FormLabel
                htmlFor="is_member_of_other_donation"
                fontWeight="bold"
              >
                અન્ય  દાનના સભ્ય છે?
              </FormLabel>
              <RadioGroup
                defaultValue={`${item.is_member_of_other_donation}`}
                onChange={(value) =>
                  setValue("is_member_of_other_donation", value === "true",  { shouldDirty: true })
                }
              >
                <Stack direction="row">
                  <Radio value={`${true}`}>હા</Radio>
                  <Radio value={`${false}`}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_member_of_other_donation && (
                <FormErrorMessage>
                  {errors.is_member_of_other_donation.message}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.is_memeber_of_sahajanadi_sabha} paddingTop="10px">
              <FormLabel
                htmlFor="is_memeber_of_sahajanadi_sabha"
                fontWeight="bold"
              >
                  સહજાનંદી સભા ના સભ્ય છે?
              </FormLabel>
              <RadioGroup
                defaultValue={`${item.is_memeber_of_sahajanadi_sabha}`}
                onChange={(value) =>
                  setValue("is_memeber_of_sahajanadi_sabha", value === "true",  { shouldDirty: true })
                }
              >
                <Stack direction="row">
                  <Radio value={`${true}`}>હા</Radio>
                  <Radio value={`${false}`}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_memeber_of_sahajanadi_sabha && (
                <FormErrorMessage>
                  {errors.is_memeber_of_sahajanadi_sabha.message}
                </FormErrorMessage>
              )}
            </FormControl>



            <FormControl
              isRequired
              isInvalid={!!errors.number_of_family_member}
              mt={4}
            >
              <FormLabel htmlFor="number_of_family_member" fontWeight="bold">
                ઘર ના કુલ સભ્ય
              </FormLabel>
              <Input
                id="number_of_family_member"
                {...register("number_of_family_member", {
                  required: "ઘર ના કુલ સભ્ય is required.",
                  pattern: {
                    value: /^(0|[1-9]\d*)$/,
                    message: "કૃપા કરીને સક્ષમ સંખ્યા દાખલ કરો.",
                  },
                })}
                placeholder="ઘર ના કુલ સભ્ય"
                type="number"
              />
              {errors.number_of_family_member && (
                <FormErrorMessage>
                  {errors.number_of_family_member.message}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl mt={4}>
  <Flex alignItems="center"> {/* Flex container with items aligned vertically */}
    <Box flex="1"> {/* Box to contain FormLabel and Input */}
      <FormLabel htmlFor="profileImage" fontWeight="bold">હરિભગત નો ફોટો</FormLabel>
      <Input
        id="profileImage"
        type="file"
        onChange={handleImageUpload}
      />
    </Box>
    {profileImage && (
      <Box ml={4}> {/* Box to contain the image preview */}
        <Box
          borderWidth="1px"
          borderRadius="full"
          borderColor="gray.200"
          p={1}
        >
          <Image
            src={URL.createObjectURL(profileImage)}
            alt="Profile Picture Preview"
            boxSize="70px"
            objectFit="cover"
            borderRadius="full"
          />
        </Box>
      </Box>
    )}
    {!profileImage && item.profile_picture && (
      <Box ml={4}> {/* Box to contain the image preview */}
        <Box
          borderWidth="1px"
          borderRadius="full"
          borderColor="gray.200"
          p={1}
        >
          <Image
            src={item.profile_picture}
            alt="Profile Picture Preview"
            boxSize="70px"
            objectFit="cover"
            borderRadius="full"
          />
        </Box>
      </Box>
    )}
  </Flex>
</FormControl>
            <FormControl isInvalid={!!errors.note} paddingTop="10px">
              <FormLabel htmlFor="note" fontWeight="bold">
                નોંધ
              </FormLabel>
              <Input
                id="note"
                {...register("note")}
                placeholder="નોંધ"
                type="text"
              />
              {errors.note && (
                <FormErrorMessage>{errors.note.message}</FormErrorMessage>
              )}
            </FormControl>
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

export default EditItem
