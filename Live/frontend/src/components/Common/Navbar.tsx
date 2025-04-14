import { Button, Flex, Icon, useDisclosure,InputGroup,InputLeftElement,Input } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa"
import { Link } from "@tanstack/react-router";

import AddUser from "../Admin/AddUser"
import AddItem from "../Items/AddItem"

interface NavbarProps {
  type: string
}

const Navbar = ({ type }: NavbarProps) => {
  const addUserModal = useDisclosure()
  const addItemModal = useDisclosure()

  return (
    <>
      <Flex py={8} gap={4}>
        {/* TODO: Complete search functionality */}
        {/* <InputGroup w={{ base: '100%', md: 'auto' }}>
          <InputLeftElement pointerEvents='none'>
            <Icon as={FaSearch} color='ui.dim' />
          </InputLeftElement>
          <Input type='text' placeholder='Search' fontSize={{ base: 'sm', md: 'inherit' }} borderRadius='8px' />
        </InputGroup> */}
        {/* <Button
          variant="primary"
          gap={1}
          fontSize={{ base: "sm", md: "inherit" }}
          onClick={type === "User" ? addUserModal.onOpen : addItemModal.onOpen}
        >
          <Icon as={FaPlus} /> {type === "Item" ? "હરિભગત" : type} ઉમેરો
        </Button> */}
        <Link to={"/addViewitem"}>
        <Button
          variant="primary"
          gap={1}
          fontSize={{ base: "sm", md: "inherit" }}
        >
          <Icon as={FaPlus} /> {type === "Item" ? "હરિભગત" : type} ઉમેરો
        </Button>
        </Link>
        <AddUser isOpen={addUserModal.isOpen} onClose={addUserModal.onClose} />
        <AddItem isOpen={addItemModal.isOpen} onClose={addItemModal.onClose} />
      </Flex>
    </>
  )
}

export default Navbar
