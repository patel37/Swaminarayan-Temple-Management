
import {
  Button,
  Menu,
  // MenuButton,
  // MenuItem,
  // MenuList,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react"
// import { BsThreeDotsVertical } from "react-icons/bs"
// import { FiEdit, FiTrash, FiTrello } from "react-icons/fi"

import { DeleteIcon, EditIcon, ViewIcon } from "@chakra-ui/icons"
import type { ItemOut, UserOut } from "../../client"
import EditUser from "../Admin/EditUser"
import EditItem from "../Items/EditItem"
import ViewUser from "../../../src/routes/_layout/addViewitem"

import ViewItem from "../Items/ViewItem"
import Delete from "./DeleteAlert";
import { Link } from "@tanstack/react-router";

interface ActionsMenuProps {
  type: string
  value: ItemOut | UserOut
  disabled?: boolean
}
const ActionsMenu = ({ type, value }: ActionsMenuProps) => {
  const editUserModal = useDisclosure();
  const ViewUserModal = useDisclosure();
  const deleteModal = useDisclosure();
  const role = localStorage.getItem("user_role");
  return (
    <>
      <Menu>
        <div style={{ display: "flex", gap: "10px" }}>
        {role === "admin" && 
          <Tooltip label="View" aria-label="View" placement="top">
            {/* Conditional link based on user type */}
          
            <Link
              to={type === "User" ? `/adminView?user_id=${value.id}` : `/viewharibhagatpage?haribhagat_id=${value.haribhagat_id}`}
              cursor="pointer"
              _hover={{ color: "blue.500" }}
            >
              <ViewIcon />
            </Link>
          </Tooltip>}
          <Tooltip label="Edit" aria-label="Edit" placement="top">
            <EditIcon
              onClick={editUserModal.onOpen}
              cursor="pointer"
              _hover={{ color: "blue.500" }}
            />
          </Tooltip>
          {role === "admin" && 
          <Tooltip label="Delete" aria-label="Delete" placement="top">
            <DeleteIcon
              onClick={deleteModal.onOpen}
              cursor="pointer"
              _hover={{ color: "red.500" }}
            />
          </Tooltip>}

        </div>

        {type === "User" ? (
          <EditUser
            user={value as UserOut}
            isOpen={editUserModal.isOpen}
            onClose={editUserModal.onClose}
          />
        ) : (
          <EditItem
            item={value as ItemOut}
            isOpen={editUserModal.isOpen}
            onClose={editUserModal.onClose}
          />
        )}

        <Delete
          type={type}
          id={value.haribhagat_id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </Menu>
    </>
  );
};


export default ActionsMenu;

