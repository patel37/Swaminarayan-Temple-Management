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
  Select,
  Stack,
  Flex,
  Image
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import React, {useState} from "react"
// import chakra from "@chakra-ui"
import { Controller, useForm } from "react-hook-form"
import { type ApiError, type ItemCreate, ItemsService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { dialColdeList } from "../../mockData"
import { scrollbarStyles } from "../../utils"
interface AddItemProps {
  isOpen: boolean
  onClose: () => void
}

const AddItem = ({ isOpen, onClose }: AddItemProps) => {
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
    showToast("Something went wrong.", "Image size exceeds the maximum allowed size (2MB). Please choose a smaller image", "error");
    setProfileImage(null);
    return;
  }

  // Proceed with the image upload
  setProfileImage(file);
};

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    // defaultValues: {
    //   title:"",
    //   // surname: "",
    //   description: "",

    // },
  })

  const mutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      ItemsService.createItem({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Item created successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["hari_bhagat"] })
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      // console.log("errrr-----",err.body.error.message)
      const errDetail = (err.body as any)?.error.message
      console.log("errDetail-----", errDetail)
      showToast("Something went wrong.", `${errDetail}`, "error")
    },

    // onError: (err: ApiError) => {
    //   let errorMessage = "Something went wrong."; // Default error message
    //   // Check if the error object contains a detail message
    //   // if (err && err.body && err.body.detail) {
    //   //   errorMessage = err.body.detail;
    //   // }
    //   console.log("errrr-----d",err)
    //   console.log("errrr-----",err.body.error.message)
    //   showToast("Error!", errorMessage, "error");
    // },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const onSubmit = async (data: ItemCreate) => {
    data.admin_id = localStorage.getItem("api_key_user") || "";
    data.number_of_family_member =
      typeof data.number_of_family_member !== "number"
        ? Number.parseInt(`${data.number_of_family_member}`)
        : data.number_of_family_member;

    // Perform image upload here if profileImage is not null
    let imageData: string | null = null;
  if (profileImage) {
    const reader = new FileReader();
    reader.readAsDataURL(profileImage);
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        imageData = reader.result.split(",")[1];
        // Include the image data in your JSON object
          // Validate image size
          const maxSizeInBytes = 1 * 1024 * 1024; // 5MB
          if (profileImage.size <= maxSizeInBytes) {
            // Include the image data in your JSON object
            data.profile_picture_base63 = imageData;
            // Submit the JSON data
            mutation.mutate(data);
          } else {
            // Display an error message or handle the oversized image
            alert("Image size exceeds the maximum allowed size (5MB). Please choose a smaller image.");
            return;
          }
      }
    };
  } else {
    // If no profile image, simply submit the form data
    mutation.mutate(data);
  }

  };

    // Custom validation rule for mobile number
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        // size={{ base: "sm", md: "md" }}
        finalFocusRef={btnRef}
        scrollBehavior={"inside"}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        

          <ModalHeader>હરિભગત ઉમેરો</ModalHeader>
          {/* હરિભગત ઉમેરો */}
          <ModalCloseButton />
          <ModalBody pb={6} css={scrollbarStyles as Interpolation<{}>}>
            {/* <Flex direction={{ base: "column", md: "row" }} gap={{ base: 4, md: 8 }}> */}
            
           

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
                  placeholder="પિતા નું નામ"
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
              <FormControl isInvalid={!!errors.email} mt={4}>
                <FormLabel htmlFor="email" fontWeight="bold">
                  ઈ-મેલ
                </FormLabel>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="ઈ-મેલ"
                  type="text"
                />
                {errors.email && (
                  <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl
                isRequired
                isInvalid={!!errors.mobile_country_code}
                mt={4}
              >
                <FormLabel htmlFor="mobile_country_code" fontWeight="bold">
                  ડાયલ કોડ
                </FormLabel>
                {/* <Input
                id="mobile_country_code"
                {...register("mobile_country_code", {
                  required: "ડાયલ કોડ is required.",
                  value:'+91'
                })}
                placeholder="ડાયલ કોડ"
                type="text"
              /> */}
                <Select {...register("mobile_country_code")}>
                  {dialColdeList.map((country, index) => (
                    <option
                      key={index}
                      value={country.dial_code}
                    >{`${country.dial_code}   ${country.name}`}</option>
                  ))}
                </Select>
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
                   સોસાયટી / ફ્લેટ / મકાન નું નામ
                </FormLabel>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="શેરી"
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

              <FormControl isInvalid={!!errors.native_place} mt={4} isRequired>
                <FormLabel htmlFor="native_place" fontWeight="bold">
                મૂળ વતન{" "}
                </FormLabel>
                <Input
                  id="native_place"
                  {...register("native_place")}
                  placeholder="મૂળ વતન"
                  type="text"
                />
                {errors.native_place && (
                  <FormErrorMessage>{errors.native_place.message}</FormErrorMessage>
                )}
              </FormControl>
              {/* native_place : string; */}

              <FormControl isInvalid={!!errors.post_office} mt={4}>
                <FormLabel htmlFor="post_office" fontWeight="bold">
                  પોસ્ટ ઓફિસ
                </FormLabel>
                <Input
                  id="post_office"
                  {...register("post_office")}
                  placeholder="પોસ્ટ ઓફિસ"
                  type="text"
                />
                {errors.post_office && (
                  <FormErrorMessage>
                    {errors.post_office.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.area} mt={4}>
                <FormLabel htmlFor="area" fontWeight="bold">
                  વિસ્તાર / સ્થળ / સેક્ટર
                </FormLabel>
                <Input
                  id="area"
                  {...register("area")}
                  placeholder="વિસ્તાર / સ્થળ / સેક્ટર"
                  type="text"
                />
                {errors.area && (
                  <FormErrorMessage>{errors.area.message}</FormErrorMessage>
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
            <FormControl isInvalid={!!errors.is_own_home} mt={4}>
              <FormLabel htmlFor="is_own_home" fontWeight="bold">
                પોતા નું ઘર છે ?
              </FormLabel>
              <RadioGroup
                onChange={(value) => setValue("is_own_home", value === "true")}
              >
                <Stack direction="row">
                  <Radio value={"true"}>હા</Radio>
                  <Radio value={"false"}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_own_home && (
                <FormErrorMessage>
                  {errors.is_own_home.message}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.note} mt={4}>
              <FormLabel
                htmlFor="is_memeber_of_land_donation"
                fontWeight="bold"
              >
                ભૂમિ દાનના દાતા છે?
              </FormLabel>
              <RadioGroup
                onChange={(value) =>
                  setValue("is_memeber_of_land_donation", value === "true")
                }
              >
                <Stack direction="row">
                  <Radio value={"true"}>હા</Radio>
                  <Radio value={"false"}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_memeber_of_land_donation && (
                <FormErrorMessage>
                  {errors.is_memeber_of_land_donation.message}
                </FormErrorMessage>
              )}
            </FormControl>


            <FormControl isInvalid={!!errors.is_member_of_other_donation} mt={4}>
              <FormLabel
                htmlFor="is_member_of_other_donation"
                fontWeight="bold"
              >
                અન્ય દાનના દાતા છે?
              </FormLabel>
              <RadioGroup
                onChange={(value) =>
                  setValue("is_member_of_other_donation", value === "true")
                }
              >
                <Stack direction="row">
                  <Radio value={"true"}>હા</Radio>
                  <Radio value={"false"}>ના</Radio>
                </Stack>
              </RadioGroup>
              {errors.is_member_of_other_donation && (
                <FormErrorMessage>
                  {errors.is_member_of_other_donation.message}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.is_memeber_of_sahajanadi_sabha} mt={4}>
              <FormLabel
                htmlFor="is_memeber_of_sahajanadi_sabha"
                fontWeight="bold"
              >
                સહજાનંદી સભા ના સભ્ય છે?
              </FormLabel>
              <RadioGroup
                onChange={(value) =>
                  setValue("is_memeber_of_sahajanadi_sabha", value === "true")
                }
              >
                <Stack direction="row">
                  <Radio value={"true"}>હા</Radio>
                  <Radio value={"false"}>ના</Radio>
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

            {/* <FormControl mt={4}>
              <FormLabel htmlFor="profileImage"  fontWeight="bold">હરિભગત નો ફોટો</FormLabel>
              
           
              <Input
                id="profileImage"
                type="file"
                onChange={handleImageUpload}
              />   
              {profileImage && (
                <Flex justifyContent="center" mb={2} >
                  <Box
                      borderWidth="1px"
                      borderRadius="full"
                      borderColor="gray.200"
                      p={1}
                    ><Image
                    src={URL.createObjectURL(profileImage)}
                    alt={`Profile Picture of ${profileImage}`}
                    boxSize="70px"
                    objectFit="cover"
                    borderRadius="full"
                  /></Box> 
                </Flex>
              )}

            </FormControl> */}

<FormControl mt={4}>
  <Flex alignItems="center"> {/* Flex container with items aligned vertically */}
    <Box flex="1"> {/* Box to contain FormLabel and Input */}
      <FormLabel htmlFor="profileImage" fontWeight="bold">હરિભગત નો ફોટો</FormLabel>
      <Input
        id="profileImage"
        type="file"
        onChange={handleImageUpload}
        // style={{ backgroundColor: 'white', border: 'none' }}
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

            {/* </GridItem>
    </SimpleGrid>
  </Box> */}
          </ModalBody>

          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddItem
