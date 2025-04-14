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
    Image,
    Flex,
    useBreakpointValue
  } from "@chakra-ui/react";
  import { createFileRoute } from '@tanstack/react-router';
  import type { ItemOut } from "../../client";
  import { formatDate } from "../../utils";
  
  interface ViewItemProps {
    item: ItemOut;
    isOpen: boolean;
    onClose: () => void;
  }
  
  const DuplicatiView = ({ item, isOpen, onClose }: ViewItemProps) => {
    const data = item;
  
    // Responsive styles
    const styleCont = {
      m: 2,
      fontSize: useBreakpointValue({ base: "sm", md: "md" }), // Responsive font size
    };
  
    const imageSize = useBreakpointValue({ base: "100px", md: "150px" }); // Responsive image size
    const modalSize = useBreakpointValue({ base: "sm", md: "md" }); // Responsive modal size
  
    const onCancel = () => {
      onClose();
    };
  
    return (
      <>
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size={modalSize}
          scrollBehavior={"inside"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent as="form">
            <ModalHeader>હરિભગત</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box borderWidth="1px" borderRadius="lg" p={2} m={2} mt={data.profile_picture ? 5 : 0}>
                {data.profile_picture && (
                  <Flex justifyContent="center" mb={2} mt={-35}>
                    <Box
                      borderWidth="1px"
                      borderRadius="full"
                      borderColor="gray.200"
                      p={1}
                    >
                      <Image
                        src={data.profile_picture}
                        alt={`Profile Picture of ${data.first_name}`}
                        boxSize={imageSize}
                        objectFit="cover"
                        borderRadius="full"
                      />
                    </Box>
                  </Flex>
                )}
                <Text {...styleCont} mt={0}>
                  <Text as="span" fontWeight="bold">
                    ID :{" "}
                  </Text>{" "}
                  {data.haribhagat_id}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    પૂરું નામ :{" "}
                  </Text>{" "}
                  {data.surname} {data.first_name} {data.middle_name}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    લિંગ :{" "}
                  </Text>{" "}
                  {data.gender}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    સરનામું :{" "}
                  </Text>{" "}
                  {data.house_no}, {data.address}, {data.area}, {data.district},{" "}
                  {data.sub_district}, {data.state}, {data.pin_code}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    મોબાઈલ નંબર :{" "}
                  </Text>{" "}
                  {data.mobile_country_code} {data.mobile}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    ઈ-મેલ:{" "}
                  </Text>{" "}
                  {data.email}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    પોતા નું ઘર છે? :{" "}
                  </Text>{" "}
                  {data.is_own_home ? "હા" : "ના"}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                  ભૂમિ દાનના દાતા છે? :{" "}
                  </Text>
                  {data.is_memeber_of_land_donation ? "હા" : "ના"}
                </Text>
                <Divider />

                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                  અન્ય  દાનના દાતા છે? :{" "}
                  </Text>
                  {data.is_member_of_other_donation ? "હા" : "ના"}
                </Text>
                <Divider />

                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    જન્મ તારીખ :{" "}
                  </Text>{" "}
                  {formatDate(data.birth_date)}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    લગ્ન ની તારીખ :{" "}
                  </Text>{" "}
                  {formatDate(data.anniversary_date)}
                </Text>
                <Divider />
                <Text {...styleCont}>
                  <Text as="span" fontWeight="bold">
                    ઘર ના કુલ સભ્ય :{" "}
                  </Text>{" "}
                  {`${data.number_of_family_member}`}
                </Text>
              </Box>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button onClick={onCancel}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  };
  
  export default DuplicatiView;
  
  export const Route = createFileRoute('/_layout/DuplicatiView')({
    component: DuplicatiView
  });
  