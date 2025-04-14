import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react';
import {
  Box,
  Select,
  Button,
  ChakraProvider,
  FormLabel,
  FormControl,
  Input,
  FormErrorMessage,
  RadioGroup,
  Stack,
  Radio,
  Flex,
  Image,
  Grid,
  useColorModeValue,
  GridItem
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { Link } from "@tanstack/react-router";
import { type ApiError, type ItemCreate, ItemsService } from "../../client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast";
import { dialColdeList } from "../../mockData";
import { useNavigate } from "@tanstack/react-router";


const MyForm = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  // F0EFFE,F1F1F2,E2E8E4,#dfddff
  const bgColor = useColorModeValue(" #f1f8f4", "#555b7d45");
  const color = useColorModeValue("#353434c7", "#fff")
  const buttonColor = useColorModeValue("#fff", "#fff")
  // const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const navigate = useNavigate()
  // const [isOpen, setIsOpen] = useState(true);

  const mutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      ItemsService.createItem({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Item created successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["hari_bhagat"] });
      reset();
      // setIsOpen(false);
      navigate("/haribhagat");
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.error.message;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
  const onSubmit = (data: ItemCreate) => {
    data.admin_id = localStorage.getItem("api_key_user") || "";
    data.number_of_family_member =
      typeof data.number_of_family_member !== "number"
        ? Number.parseInt(`${data.number_of_family_member}`)
        : data.number_of_family_member;

    let imageData: string | null = null;
    if (profileImage) {
      const reader = new FileReader();
      reader.readAsDataURL(profileImage);
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          imageData = reader.result.split(",")[1];
          const maxSizeInBytes = 2 * 1024 * 1024;
          if (profileImage.size <= maxSizeInBytes) {
            data.profile_picture_base63 = imageData;
            mutation.mutate(data);
          } else {
            alert("Image size exceeds the maximum allowed size (2MB). Please choose a smaller image.");
          }
        }
      };
    } else {
      mutation.mutate(data);
    }
  };


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setProfileImage(file);
    } else {
      alert("Please upload a valid image (JPEG or PNG).");
    }
  };


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
    <Flex
    w={{ base: "95%", md: "80%" }} 
    alignItems="center"
    justifyContent="center"
    p={{ base: 4, md: 7, lg: 3 }} 
    mt={{ base: 8, md: 5, lg: 0 }}
    mb={{ base: 4, md: 5, lg: 8 }} 
    position="absolute"
    // height={820}
    
    >
       <Box
      position="relative"
        left={{ base: 0, sm: 5, md: 0 }} 
        // zIndex={2}
        w={{ base: "100%", md: "190vh",lg: "200vh",xl: "230vh",'2xl': "130vh"}}
        padding="5"
        // borderWidth="1px" 
        borderRadius="md"
        // borderColor="#009688"
        bg={bgColor}
      >

        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <fieldset style={{ border: '1px solid #009688', borderRadius: '5px', padding: '16px' }}>
          <legend style={{ fontWeight: 'bold', fontSize: '18px' }}>હરિભગત ઉમેરો</legend>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={6}>
            {/* Left column for personal details */}
            <GridItem>
            {/* <FormLabel htmlFor="address_info" fontWeight="bold" paddingTop="0px" color={'black'}>
            નામ
            </FormLabel> */}
              <FormControl isRequired isInvalid={!!errors.surname} mt={0}>
                <FormLabel htmlFor="surname" fontWeight="bold" fontSize={15} >
                  અટક
                </FormLabel>
                <Input
                  id="surname"
                  {...register("surname", {
                    required: "અટક is required.",
                  })}
                  placeholder="અટક "
                  type="text"
                  borderColor={color}

                />
                {errors.surname && (
                  <FormErrorMessage>{errors.surname.message}</FormErrorMessage>
                )}
              </FormControl>
              </GridItem>

              <FormControl isRequired isInvalid={!!errors.first_name} mt={0}>
                <FormLabel htmlFor="first_name" fontWeight="bold"fontSize={15}>
                  પોતા નું નામ
                </FormLabel>
                <Input
                  id="first_name"
                  {...register("first_name", {
                    required: "પોતા નું નામ is required.",
                  })}
                  placeholder="પોતા નું નામ"
                  type="text"
                  borderColor={color}
                />
                {errors.first_name && (
                  <FormErrorMessage>{errors.first_name.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.middle_name} mt={0}>
                <FormLabel htmlFor="middle_name" fontWeight="bold" fontSize={15}>
                  પિતા / પતિ   નું નામ
                </FormLabel>
                <Input
                  id="middle_name"
                  {...register("middle_name", {
                    required: "પિતા / પતિ   નું નામ is required.",
                  })}
                  placeholder="પિતા / પતિ   નું નામ"
                  type="text"
                  borderColor={color}
                />
                {errors.middle_name && (
                  <FormErrorMessage>{errors.middle_name.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.gender} mt={0}>
                <FormLabel htmlFor="gender" fontWeight="bold" fontSize={15}>
                  લિંગ
                </FormLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Stack direction="row">
                        <Radio value="Male" borderColor={color}>પુરુષ</Radio>
                        <Radio value="Female" borderColor={color}>સ્ત્રી</Radio>
                        <Radio value="Transgender" borderColor={color}>અન્ય</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />
                {errors.gender && (
                  <FormErrorMessage>{errors.gender.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.birth_date} mt={0}>
                <FormLabel htmlFor="birth_date" fontWeight="bold" fontSize={15}>
                  જન્મ તારીખ 
                </FormLabel>
                <Input
                  id="birth_date"
                  {...register("birth_date", {
                    required: "Birthdate is required.",
                  })}
                  placeholder="Select birthdate"
                  type="date"
                  borderColor={color}
                />
                {errors.birth_date && (
                  <FormErrorMessage>{errors.birth_date.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.anniversary_date} mt={0}>
                <FormLabel htmlFor="anniversary_date" fontWeight="bold" fontSize={15}>
                  લગ્ન ની તારીખ
                </FormLabel>
                <Input
                  id="anniversary_date"
                  {...register("anniversary_date")}
                  placeholder="Select birthdate"
                  type="date"
                  borderColor={color}
                />
                {errors.anniversary_date && (
                  <FormErrorMessage>
                    {errors.anniversary_date.message}
                  </FormErrorMessage>
                )}
              </FormControl>
            {/* <GridItem>
              <FormControl isInvalid={!!errors.email} mt={0}>
                <FormLabel htmlFor="email" fontWeight="bold" fontSize={15}>
                  ઈ-મેલ
                </FormLabel>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="ઈ-મેલ"
                  type="text"
                  borderColor={color}
                />
                {errors.email && (
                  <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
              </FormControl>
              </GridItem> */}

              <FormControl
                isRequired
                isInvalid={!!errors.mobile_country_code}
                mt={0}
              >
                <FormLabel htmlFor="mobile_country_code" fontWeight="bold" fontSize={15}>
                  ડાયલ કોડ
                </FormLabel>
                <Select {...register("mobile_country_code")} borderColor={color}>
                  {dialColdeList.map((country, index) => (
                    <option key={index} value={country.dial_code}>
                      {`${country.dial_code} ${country.name}`}
                    </option>
                  ))}
                </Select>
                {errors.mobile_country_code && (
                  <FormErrorMessage>
                    {errors.mobile_country_code.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.mobile} mt={0}>
                <FormLabel htmlFor="mobile" fontWeight="bold" fontSize={15}>
                  મોબાઈલ નંબર
                </FormLabel>
                <Input
                  id="mobile"
                  {...register("mobile", {
                    required: "મોબાઈલ નંબર is required.",
                    validate: validateMobile,
                  })}
                  placeholder="મોબાઈલ નંબર"
                  type="text"
                  borderColor={color}
                />
                {errors.mobile && (
                  <FormErrorMessage>{errors.mobile.message}</FormErrorMessage>
                )}
              </FormControl>
              <GridItem>
              <FormControl isInvalid={!!errors.house_no} mt={0}>
                <FormLabel htmlFor="house_no" fontWeight="bold" fontSize={15}>
                  ઘર નંબર
                </FormLabel>
                <Input
                  id="house_no"
                  {...register("house_no")}
                  placeholder="ઘર નંબર"
                  type="text"
                  borderColor={color}
                />
                {errors.house_no && (
                  <FormErrorMessage>{errors.house_no.message}</FormErrorMessage>
                )}
              </FormControl>
              </GridItem>
      
              <FormControl isInvalid={!!errors.address} mt={0}>
                <FormLabel htmlFor="address" fontWeight="bold" fontSize={15}>
                સોસાયટી / ફ્લેટ / મકાન નું નામ
                </FormLabel>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder=" સોસાયટી / ફ્લેટ / મકાન નું નામ"
                  type="text"
                  borderColor={color}
                />
                {errors.address && (
                  <FormErrorMessage>{errors.address.message}</FormErrorMessage>
                )}
              </FormControl>
                           
              {/* <FormControl isInvalid={!!errors.address} mt={4}>
                <FormLabel htmlFor="address" fontWeight="bold">
                  સોસાયટી / ફ્લેટ / મકાન નું નામ
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
                  
              </FormControl> */}

            <FormControl isInvalid={!!errors.landmark} mt={0}>
                <FormLabel htmlFor="landmark" fontWeight="bold" fontSize={15}>
                નજીક નું જાણીતું સ્થાન
                </FormLabel>
                <Input
                  id="landmark"
                  {...register("landmark")}
                  placeholder=" નજીક નું જાણીતું સ્થાન"
                  type="text"
                  borderColor={color}
                />
                {errors.landmark && (
                  <FormErrorMessage>{errors.landmark.message}</FormErrorMessage>
                )}
              </FormControl>

              

              {/* <FormControl isRequired isInvalid={!!errors.area} mt={0}>
                <FormLabel htmlFor="area" fontWeight="bold" fontSize={15}>
                  વિસ્તાર / સ્થળ / સેક્ટર
                </FormLabel>
                <Input
                  id="address"
                  {...register("area")}
                  placeholder="વિસ્તાર / સ્થળ / સેક્ટર"
                  type="text"
                  borderColor={color}
                />
                {errors.area && (
                  <FormErrorMessage>{errors.area.message}</FormErrorMessage>
                )}
              </FormControl> */}
              <FormControl isRequired isInvalid={!!errors.sub_district} mt={0}>
                <FormLabel htmlFor="sub_district" fontWeight="bold" fontSize={15}>
                  તાલુકા
                </FormLabel>
                <Input
                  id="sub_district"
                  {...register("sub_district", {
                    required: "તાલુકા is required.",
                  })}
                  placeholder="તાલુકા"
                  type="text"
                  borderColor={color}
                />
                {errors.sub_district && (
                  <FormErrorMessage>
                    {errors.sub_district.message}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.district} mt={0}>
                <FormLabel htmlFor="district" fontWeight="bold" fontSize={15}>
                  જિલ્લો
                </FormLabel>
                <Input
                  id="district"
                  {...register("district", {
                    required: "જિલ્લો is required.",
                  })}
                  placeholder="જિલ્લો"
                  type="text"
                  borderColor={color}
                />
                {errors.district && (
                  <FormErrorMessage>{errors.district.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.state} mt={0}>
                <FormLabel htmlFor="state" fontWeight="bold" fontSize={15}>
                  રાજ્ય
                </FormLabel>
                <Input
                  id="state"
                  {...register("state", {
                    required: "રાજ્ય is required.",
                  })}
                  placeholder="રાજ્ય"
                  type="text"
                  borderColor={color}
                />
                {errors.state && (
                  <FormErrorMessage>{errors.state.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.pin_code} mt={0}>
                <FormLabel htmlFor="pin_code" fontWeight="bold" fontSize={15}>
                  પિન કોડ
                </FormLabel>
                <Input
                  id="pin_code"
                  {...register("pin_code")}
                  placeholder="પિન કોડ"
                  type="text"
                  borderColor={color}
                />
                {errors.pin_code && (
                  <FormErrorMessage>{errors.pin_code.message}</FormErrorMessage>
                )}
              </FormControl>


              <FormControl isRequired isInvalid={!!errors.native_place} mt={0}>
                <FormLabel htmlFor="native_place" fontWeight="bold" fontSize={15}>
                  મૂળ વતન
                </FormLabel>
                <Input
                  id="native_place"
                  {...register("native_place", {
                    required: "મૂળ વતન is required.",
                  })}
                  placeholder="મૂળ વતન"
                  type="text"
                  borderColor={color}
                />
                {errors.native_place && (
                  <FormErrorMessage>{errors.native_place.message}</FormErrorMessage>
                )}
              </FormControl>


              <FormControl isInvalid={!!errors.number_of_family_member} mt={0}>
                <FormLabel htmlFor="pin_code" fontWeight="bold" fontSize={15}>
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
                  borderColor={color}
                />
                {errors.number_of_family_member && (
                  <FormErrorMessage>{errors.number_of_family_member.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.business_name} mt={0}>
                <FormLabel htmlFor="business_name" fontWeight="bold"fontSize={15}>
                 વ્યવસાય
                </FormLabel>
                <Input
                  id="business_name"
                  {...register("business_name", {
                    required: "વ્યવસાય નું નામ is required.",
                  })}
                  placeholder="વ્યવસાય"
                  type="text"
                  borderColor={color}
                />
                {errors.business_name && (
                  <FormErrorMessage>{errors.business_name.message}</FormErrorMessage>
                )}
              </FormControl>


              
              {/* <FormControl
                isRequired
                isInvalid={!!errors.number_of_family_member}
                mt={4}
              >
                <FormLabel htmlFor="number_of_family_member" fontWeight="bold" fontSize={15}>
                  ઘર ના કુલ સભ્ય
                </FormLabel>
                <Input
                  id="number_of_family_member"
                  {...register("number_of_family_member", {
                    required: "ઘર ના કુલ સભ્ય is required.",
                    pattern: {
                      value: /^[1-9]\d*$/,
                      message: "કૃપા કરીને સક્ષમ સંખ્યા દાખલ કરો.",
                    },
                  })}
                  placeholder="ઘર ના કુલ સભ્ય"
                  type="number"
                  borderColor={color}
                />
                {errors.number_of_family_member && (
                  <FormErrorMessage>
                    {errors.number_of_family_member.message}
                  </FormErrorMessage>
                )}
              </FormControl> */}


             
              <FormControl mt={4}>
                <Flex alignItems="center"> {/* Flex container with items aligned vertically */}
                  <Box flex="1"> {/* Box to contain FormLabel and Input */}
                    <FormLabel htmlFor="profileImage" fontWeight="bold" fontSize={15}>હરિભગત નો ફોટો</FormLabel>
                    <Input
                      id="profileImage"
                      type="file"
                      onChange={handleImageUpload}
                    // style={{ backgroundColor: 'white', border: 'none' }}
                    borderColor={color}
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
                <FormLabel htmlFor="note" fontWeight="bold" fontSize={15}>
                  નોંધ
                </FormLabel>
                <Input
                  id="note"
                  {...register("note")}
                  placeholder="નોંધ"
                  type="text"
                  borderColor={color}
                />
                {errors.note && (
                  <FormErrorMessage>{errors.note.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.is_own_home} mt={0}>
                <FormLabel htmlFor="is_own_home" fontWeight="bold" fontSize={15}>
                  પોતા નું ઘર છે ?
                </FormLabel>
                <RadioGroup
                  onChange={(value) => setValue("is_own_home", value === "true")}

                >
                  <Stack direction="row">
                    <Radio value={"true"} borderColor={color}>હા</Radio>
                    <Radio value={"false"} borderColor={color} >ના</Radio>
                  </Stack>
                </RadioGroup>
                {errors.is_own_home && (
                  <FormErrorMessage>
                    {errors.is_own_home.message}
                  </FormErrorMessage>
                )}
              </FormControl>


              <FormControl isInvalid={!!errors.is_memeber_of_sahajanadi_sabha} mt={0}>
                <FormLabel htmlFor="is_memeber_of_sahajanadi_sabha" fontWeight="bold" fontSize={15}>
                    સહજાનંદી સભા ના સભ્ય છે?
                </FormLabel>
                <RadioGroup
                  onChange={(value) => setValue("is_memeber_of_sahajanadi_sabha", value === "true")}

                >
                  <Stack direction="row">
                    <Radio value={"true"} borderColor={color}>હા</Radio>
                    <Radio value={"false"} borderColor={color} >ના</Radio>
                  </Stack>
                </RadioGroup>
                {errors.is_memeber_of_sahajanadi_sabha && (
                  <FormErrorMessage>
                    {errors.is_memeber_of_sahajanadi_sabha.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.note} mt={0}>
                <FormLabel
                  htmlFor="is_memeber_of_land_donation"
                  fontWeight="bold"
                  fontSize={15}
                >
                  ભૂમિ દાનના દાતા છે? :{" "}
                </FormLabel>
                <RadioGroup
                  onChange={(value) =>
                    setValue("is_memeber_of_land_donation", value === "true")
                  }
                >
                  <Stack direction="row">
                    <Radio value={"true"} borderColor={color}>હા</Radio>
                    <Radio value={"false"} borderColor={color}>ના</Radio>
                  </Stack>
                </RadioGroup>
                {errors.is_memeber_of_land_donation && (
                  <FormErrorMessage>
                    {errors.is_memeber_of_land_donation.message}
                  </FormErrorMessage>
                )}
              </FormControl>


              <FormControl isInvalid={!!errors.note} mt={0}>
                <FormLabel
                  htmlFor="is_member_of_other_donation"
                  fontWeight="bold"
                  fontSize={15}
                >
                 અન્ય  દાનના દાતા છે? :{" "}
                </FormLabel>
                <RadioGroup
                  onChange={(value) =>
                    setValue("is_member_of_other_donation", value === "true")
                  }
                >
                  <Stack direction="row">
                    <Radio value={"true"} borderColor={color}>હા</Radio>
                    <Radio value={"false"} borderColor={color}>ના</Radio>
                  </Stack>
                </RadioGroup>
                {errors.is_member_of_other_donation && (
                  <FormErrorMessage>
                    {errors.is_member_of_other_donation.message}
                  </FormErrorMessage>
                )}
              </FormControl>

          </Grid>
          
          <Button
      bg="var(--chakra-colors-ui-main)"
      variant="primary"
      mt={4}
      type="submit"
      isLoading={isSubmitting}
      color={buttonColor}
      onClick={onSubmit}
    >
      Save
    </Button>

            <Link to="/haribhagat">
                <Button variant="primary" bg="rgb(132 131 131 / 29%)" mt={4} ml={3}>Cancel</Button>
            </Link>
          </fieldset>
        </Box>
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
export const Route = createFileRoute('/_layout/addViewitem')({
  component: App,
})