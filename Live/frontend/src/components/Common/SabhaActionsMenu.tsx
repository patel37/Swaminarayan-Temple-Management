import {
    Tooltip,
    useDisclosure,
  } from "@chakra-ui/react";
  import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
  import type { ItemSabha } from "../../client"
//   import { Link } from "@tanstack/react-router";
  import EditSabha from "../Items/Sabha";
//   import ViewSabha from "../Sabha/ViewSabha";
  import Delete from "./DeleteAlert";
  
  interface ActionsSabhaMenuProps {
    type: string
    value: ItemSabha
    disabled?: boolean
  }
  
  const ActionsSabhaMenu = ({ value }: ActionsSabhaMenuProps) => {
    const editSabhaModal = useDisclosure();
    const deleteModal = useDisclosure();
    const role = localStorage.getItem("user_role");
  
    return (
      <>
        <div style={{ display: "flex", gap: "10px" }}>
          <Tooltip label="Edit" aria-label="Edit" placement="top">
            <EditIcon
              onClick={editSabhaModal.onOpen}
              cursor="pointer"
              _hover={{ color: "blue.500" }}
            />
          </Tooltip>
          {role === "admin" && (
            <Tooltip label="Delete" aria-label="Delete" placement="top">
              <DeleteIcon
                onClick={deleteModal.onOpen}
                cursor="pointer"
                _hover={{ color: "red.500" }}
              />
            </Tooltip>
          )}
        </div>
  
        <EditSabha
          sabha={value as ItemSabha}
          isOpen={editSabhaModal.isOpen}
          onClose={editSabhaModal.onClose}
        />
  
        <Delete
          type="Sabha"
          id={value.sabha_id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </>
    );
  };
  
  export default ActionsSabhaMenu;
  