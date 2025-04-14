import React from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  useColorModeValue,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { AdminService } from "../../client" // Adjust this path as necessary
import useCustomToast from "../../hooks/useCustomToast" // Assuming this is your custom hook

type PDFViewForm = {
    id:string;
  pdfViewPreference: string;
};

const PDFViewSettings = () => {
  const color = useColorModeValue('inherit', 'ui.light');
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PDFViewForm>({
    defaultValues: {
      pdfViewPreference: 'table',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { id: string; pdfViewPreference: string }) =>
        AdminService.updatePDFViewSettings({ ...data }),
    onSuccess: () => {
      showToast('Success!', 'PDF view preference updated.', 'success');
    },
    onError: (err: any) => {
      showToast('Something went wrong.', 'Failed to update PDF view.', 'error');
    },
  });

  const onSubmit = (data: PDFViewForm) => {
    // const adminId = localStorage.getItem('admin_id'); // Assuming admin ID is stored here
  
    // if (!adminId) {
    //   showToast('Error', 'Admin ID not found.', 'error');
    //   return;
    // }
    data.id = localStorage.getItem("api_key_user") || "";
  
    mutation.mutate( data );
  };
  

  return (
    <>
      <Container maxW="full" as="form" onSubmit={handleSubmit(onSubmit)}>
        <Heading size="sm" py={4}>
          PDF View Preferences
        </Heading>
        <Box w={{ sm: 'full', md: '50%' }}>
          <FormControl isInvalid={!!errors.pdfViewPreference}>
            <FormLabel color={color} htmlFor="pdfViewPreference">
              Choose PDF View
            </FormLabel>
            <RadioGroup defaultValue="table">
              <Stack>
                <Radio
                  value="table"
                  {...register('pdfViewPreference', {
                    required: 'Please select a PDF view option',
                  })}
                  colorScheme="teal"
                >
                  Table View
                  <Badge ml="1" colorScheme="teal">
                    Default
                  </Badge>
                </Radio>
                <Radio
                  value="grid"
                  {...register('pdfViewPreference')}
                  colorScheme="teal"
                >
                  Grid View
                </Radio>
              </Stack>
            </RadioGroup>
            {errors.pdfViewPreference && (
              <FormErrorMessage>
                {errors.pdfViewPreference.message}
              </FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="primary"
            mt={4}
            type="submit"
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default PDFViewSettings;