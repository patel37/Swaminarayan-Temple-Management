import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Input,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import React, { useState } from "react"
import { useForm } from "react-hook-form"

import { ItemsService, UsersService, serviceSabha } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

interface DeleteProps {
  type: string
  id: string
  isOpen: boolean
  onClose: () => void
}

const Delete = ({ type, id, isOpen, onClose }: DeleteProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const cancelRef = React.useRef<HTMLButtonElement | null>(null)
  const [password, setPassword] = useState("") // To store the entered password
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(true) // To handle password validation

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteEntity = async (id: string) => {
    if (type === "Item") {
      await ItemsService.deleteHaribhagat({ id: id })
    } else if (type === "User") {
      await UsersService.deleteUser({ userId: id })
    } else if (type === "Sabha") {
      await serviceSabha.deleteSabha({ id: id }) // Added Sabha delete API call
    } else {
      throw new Error(`Unexpected type: ${type}`)
    }
  }

  const mutation = useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      showToast(
        "Success",
        `The ${type.toLowerCase()} was deleted successfully.`,
        "success"
      )
      onClose()
    },
    onError: () => {
      showToast(
        "An error occurred.",
        `An error occurred while deleting the ${type.toLowerCase()}.`,
        "error"
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [type === "Item" ? "hari_bhagat" : "users"],
      })
    },
  })

  const onSubmit = async () => {
    // Check if the entered password matches the correct one
    if (password === "HK79VDS79") {
      setIsPasswordCorrect(true)
      mutation.mutate(id)
    } else {
      setIsPasswordCorrect(false) // Invalid password
    }
  }

  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      leastDestructiveRef={cancelRef}
      size={{ base: "sm", md: "md" }}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <AlertDialogHeader>Delete</AlertDialogHeader>

          <AlertDialogBody>
            {type === "User" && (
              <span>
                All items associated with this user will also be{" "}
                <strong>permanently deleted.</strong>
              </span>
            )}
             {type != "User" && (
            <div>શું તમે દૂર કરવા માટે ચોક્કસ છો (Are you sure delete permanently )?.</div>  )}
            <div>
                <Input
                  type="password"
                  placeholder="Enter password to confirm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isInvalid={!isPasswordCorrect} // Show error if password is incorrect
                  errorBorderColor="red.300"
                  mt={3} />
                {!isPasswordCorrect && (
                  <div style={{ color: 'red', marginTop: '10px' }}>
                    Incorrect password. Please try again.
                  </div>
                )}
              </div>
           
          </AlertDialogBody>

          <AlertDialogFooter gap={3}>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              કાઢી નાખો
            </Button>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isSubmitting}>
              રદ કરો
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export default Delete
