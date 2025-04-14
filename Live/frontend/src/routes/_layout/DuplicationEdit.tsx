import { createFileRoute } from '@tanstack/react-router'
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
    Checkbox,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SubmitHandler, useForm } from "react-hook-form"
import { dateConvert, scrollbarStyles } from "../../utils"
import React, { useState } from "react"
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

const DuplicationEdit = ({ item, isOpen, onClose }: EditItemProps) => {
    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const btnRef = React.useRef(null)
    const [profileImage, setProfileImage] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
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
                    const maxSizeInBytes = 1 * 1024 * 1024; // 1MB
                    if (profileImage.size <= maxSizeInBytes) {
                        data.profile_picture_base63 = imageData;
                        mutation.mutate(data);
                    } else {
                        alert("Image size exceeds the maximum allowed size (1MB). Please choose a smaller image.");
                        return;
                    }
                }
            };
        } else {
            mutation.mutate(data);
        }
    }

    const onCancel = () => {
        setProfileImage(null);
        reset()
        onClose()
    }

    // if (item.is_verified) {
        return (
            <>
                <Modal
                    isOpen={isOpen}
                    onClose={() => { setProfileImage(null), onClose() }}
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
                                        // width={{ base: "100%", md: "80%" }} // Responsive width
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
                                        // width={{ base: "100%", md: "80%" }} // Responsive width
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
                                        // width={{ base: "100%", md: "80%" }} // Responsive width
                                    />
                                    {errors.middle_name && (
                                        <FormErrorMessage>
                                            {errors.middle_name.message}
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
                                    // width={{ base: "100%", md: "0%" }} // Responsive width
                                />
                                {errors.number_of_family_member && (
                                    <FormErrorMessage>
                                        {errors.number_of_family_member.message}
                                    </FormErrorMessage>
                                )}
                            </FormControl>

                            <FormControl mt={4}>
                                <Checkbox {...register("is_verified")} colorScheme="teal">
                                    is_verified
                                </Checkbox>
                            </FormControl>
                            </Box>
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
// }

export default DuplicationEdit

export const Route = createFileRoute('/_layout/DuplicationEdit')({
    component: DuplicationEdit
})
