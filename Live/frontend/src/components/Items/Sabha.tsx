import {
  Button,
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
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ApiError,
  type SabhaOut,
  type sabhaUpdate,
  serviceSabha,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast";

interface EditSabhaProps {
  sabha: SabhaOut;
  isOpen: boolean;
  onClose: () => void;
}

const EditSabha = ({ sabha, isOpen, onClose }: EditSabhaProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<sabhaUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { ...sabha },
  });

  const mutation = useMutation({
    mutationFn: (data: sabhaUpdate) =>
      serviceSabha.updateSabha({
        sabha_id: sabha.sabha_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showToast("Success!", "Sabha updated successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["sabha_list"] });
      onClose();
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
  });

  const onSubmit: SubmitHandler<sabhaUpdate> = async (data) => {
    mutation.mutate(data);
  };

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Edit Sabha</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired isInvalid={!!errors.sabha_name} mt={4}>
            <FormLabel htmlFor="sabha_name">સભા નું નામ</FormLabel>
            <Input
              id="sabha_name"
              {...register("sabha_name", { required: "Sabha Name is required." })}
            />
            {errors.sabha_name && <FormErrorMessage>{errors.sabha_name.message}</FormErrorMessage>}
          </FormControl>
  
          <FormControl isRequired isInvalid={!!errors.sabha_date} mt={4}>
            <FormLabel htmlFor="sabha_date">તારીખ</FormLabel>
            <Input
              id="sabha_date"
              type="date"
              {...register("sabha_date", { required: "Sabha Date is required." })}
            />
            {errors.sabha_date && <FormErrorMessage>{errors.sabha_date.message}</FormErrorMessage>}
          </FormControl>
  
          <FormControl isRequired isInvalid={!!errors.from_time} mt={4}>
            <FormLabel htmlFor="from_time">ચાલુ થવાના સમય</FormLabel>
            <Input
              id="from_time"
              type="time"
              {...register("from_time", { required: "From Time is required." })}
            />
            {errors.from_time && <FormErrorMessage>{errors.from_time.message}</FormErrorMessage>}
          </FormControl>
  
          <FormControl isRequired isInvalid={!!errors.to_time} mt={4}>
            <FormLabel htmlFor="to_time">પૂરો થવાના સમય</FormLabel>
            <Input
              id="to_time"
              type="time"
              {...register("to_time", { required: "To Time is required." })}
            />
            {errors.to_time && <FormErrorMessage>{errors.to_time.message}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
  
        <ModalFooter gap={3}>
          <Button variant="primary" type="submit" isLoading={isSubmitting} isDisabled={!isDirty}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
  
};

export default EditSabha;
