import {
    Box,
    Button,
    Divider,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Flex,
    FormControl,
    Checkbox,
    Tooltip
} from "@chakra-ui/react";
import { useEffect, useState } from 'react';
import type { ApiError, ItemOut } from "../../client";
// import { formatDate } from "../../utils";
import { ItemsService } from "../../client";
import DuplicationEdit from "../_layout/DuplicationEdit";
import { EditIcon, ViewIcon, DeleteIcon } from "@chakra-ui/icons";
import { useForm } from "react-hook-form";
import Delete from "../../../src/components/Common/DeleteAlert";
import DuplicatiView from './DuplicatiView';
// import ActionsMenu from '../../components/Common/ActionsMenu';

import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ItemUpdate } from "../../client/models/ItemUpdate";
import useCustomToast from "../../hooks/useCustomToast";

interface ViewItemProps {
    item: ItemOut;
    isOpen: boolean;
    onClose: () => void;
}

const Duplication = ({ item, isOpen, onClose }: ViewItemProps) => {
    const showToast = useCustomToast();
    const data = item;
    const [duplicationData, setDuplicationData] = useState<ItemOut[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDupItem, setSelectedDupItem] = useState<ItemOut | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const { register, setValue } = useForm();
    const queryClient = useQueryClient()

    const styleCont = {
        m: 2,
    };

    const onCancel = () => {
        onClose();
    };

    useEffect(() => {
        if (isOpen && data.haribhagat_id) {
            setLoading(true);
            setError(null);
            ItemsService.duplication({ haribhagat_id: data.haribhagat_id })
                .then((response) => {
                    setDuplicationData(response.data);
                })
                .catch((err) => {
                    setError("Failed to fetch duplication data");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, data.haribhagat_id]);

    const mutation = useMutation({
        mutationFn: (datas: {is_verified: boolean, haribhagat_id: string}) =>
            ItemsService.updateItem({
                haribhagat_id: data.haribhagat_id,
                requestBody: datas,
            }),
        onSuccess: () => {
            showToast("Success!", "Item updated successfully.", "success")
            // setProfileImage(null);hari_bhagat_doublicate
            queryClient.invalidateQueries({ queryKey: ["hari_bhagat_doublicate"] })
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

    const handleVerificationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const isVerified = e.target.checked;
        setValue("is_verified", isVerified);
       
        try {
            const requestBody = { is_verified: isVerified, haribhagat_id: data.haribhagat_id };
            console.log("Request Body:", requestBody);
            mutation.mutate(requestBody);
            // await ItemsService.updateItem({
            //     haribhagat_id: data.haribhagat_id,
            //     requestBody,
            // });
            
          
            // Optionally, you can show a success toast or handle state changes here
        } catch (error) {
            setError("Failed to update verification status.");
            console.error("Error:", error);
        }
    };

    const openEditModal = (dupItem: ItemOut) => {
        setSelectedDupItem(dupItem);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
         
    };

    const openDeleteDialog = (dupItemId: string) => {
        setItemToDelete(dupItemId);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
    };

    const openViewModal = (dupItem: ItemOut) => {
        setSelectedDupItem(dupItem);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior={"inside"} isCentered>
                <ModalOverlay />
                <ModalContent as="form">
                    <ModalHeader>હરિભગત</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box borderWidth="1px" borderRadius="lg" p={2} m={2}>

                            <Text {...styleCont} mt={0}>
                                <Text as="span" fontWeight="bold">ID : </Text> {data.haribhagat_id}
                            </Text>
                            <Divider />
                            <Text {...styleCont}><Text as="span" fontWeight="bold">પૂરું નામ : </Text> {data.surname} {data.first_name} {data.middle_name}</Text>
                            <Divider />
                            {/* <Text {...styleCont}><Text as="span" fontWeight="bold">જન્મ તારીખ : </Text>{formatDate(data.birth_date)}</Text> */}
                            <FormControl mt={4}>
                                <Checkbox
                                    {...register("is_verified")}
                                    colorScheme="teal"
                                    defaultChecked={data.is_verified}
                                    onChange={handleVerificationChange}
                                >
                                    is_verified
                                </Checkbox>
                            </FormControl>
                            {/* <ActionsMenu type={"Item"} value={item} /> */}
                            <Flex align="center" style={{ display: "flex", gap: "10px" }}  mt={4}>
                            <Tooltip label="View" aria-label="View" placement="top">
                                <ViewIcon
                                    cursor="pointer"
                                    _hover={{ color: "blue.500" }}
                                    onClick={() => openViewModal(data)}
                                />
                                </Tooltip>
                                <Tooltip label="Edit" aria-label="Edit" placement="top">
                                    <EditIcon onClick={() => openEditModal(data)} cursor="pointer" _hover={{ color: "blue.500" }} />
                                </Tooltip>
                                <Tooltip label="Delete" aria-label="Delete" placement="top">
                                    <DeleteIcon onClick={() => openDeleteDialog(data.haribhagat_id)} cursor="pointer" _hover={{ color: "red.500" }} />
                                </Tooltip>
                            </Flex>

                            <Divider mt={2}/>

                            {loading && <Text>Loading duplication data...</Text>}
                            {error && <Text color="red.500">{error}</Text>}

                            {duplicationData.length > 0 ? (
                                <Box mt={4}>
                                    <Text fontWeight="bold" fontSize="lg">Duplication Data</Text>
                                    {duplicationData.map((dupItem, index) => (
                                        <Box key={index} p={2} borderWidth="1px" borderRadius="lg" mt={2}>
                                            <Text><strong>ID:</strong> {dupItem.haribhagat_id}</Text>
                                            <Text><strong>પૂરું નામ:</strong> {dupItem.surname} {dupItem.middle_name} {dupItem.first_name}</Text>
                                            <Box mt={5}>
                                                <Flex align="center" style={{ display: "flex", gap: "10px" }} >
                                                    <Tooltip label="View" aria-label="View" placement="top">
                                                        <ViewIcon
                                                            cursor="pointer"
                                                            _hover={{ color: "blue.500" }}
                                                            onClick={() => openViewModal(dupItem)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Edit" aria-label="Edit" placement="top">
                                                        <EditIcon onClick={() => openEditModal(dupItem)} cursor="pointer" _hover={{ color: "blue.500" }} />
                                                    </Tooltip>
                                                    <Tooltip label="Delete" aria-label="Delete" placement="top">
                                                        <DeleteIcon onClick={() => openDeleteDialog(dupItem.haribhagat_id)} cursor="pointer" _hover={{ color: "red.500" }} />
                                                    </Tooltip>
                                                </Flex>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                !loading && <Text>કોઈ ડુપ્લિકેશન રેકોર્ડ મળ્યા નથી.</Text>
                            )}
                        </Box>
                    </ModalBody>
                    <ModalFooter gap={3}>
                        <Button onClick={onCancel}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>


            {selectedDupItem && (
                <DuplicatiView item={selectedDupItem} isOpen={isViewModalOpen} onClose={closeViewModal} />
            )}

            {/* Edit Modal */}
            {selectedDupItem && (
                <DuplicationEdit item={selectedDupItem} isOpen={isEditModalOpen} onClose={closeEditModal} />
            )}

            {itemToDelete && (
                <Delete
                    type="Item"
                    id={itemToDelete}
                    isOpen={isDeleteDialogOpen}
                    onClose={closeDeleteDialog}
                />
            )}
        </>
    );
};
export default Duplication;

export const Route = createFileRoute('/_layout/duplicationrecodeshow')({
    component: Duplication
});

