export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
  message: "Invalid email address",
}

export const passwordRules = (isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
  }

  if (isRequired) {
    rules.required = "Password is required"
  }

  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true,
) => {
  const rules: any = {
    validate: (value: string) => {
      value === getValues().password || "The passwords do not match"
    }
  }

  if (isRequired) {
    rules.required = "Password confirmation is required"
  }

  return rules
}

export const dateConvert = (dateString: string | null) => {
  if (!dateString) return null // If dateString is null or undefined, return null
  const dateObject = new Date(dateString)
  dateObject.setDate(dateObject.getDate())
  return dateObject.toISOString().split("T")[0] // Extracting the date part
}

export const scrollbarStyles = {
  "&::-webkit-scrollbar": {
    width: "1px", // Adjust scrollbar width
    height: "0px", // Adjust scrollbar height
  },
  "&::-webkit-scrollbar-thumb": {
    background: "gray", // Adjust scrollbar thumb color
    borderRadius: "4px", // Adjust scrollbar thumb border radius
  },
  "-ms-overflow-style": "none", // Hide scrollbar for IE and Edge
  scrollbarWidth: "thin", // Adjust scrollbar width for Firefox
}

export const formatDate = (dateString: string | null): string | null => {
  if (!dateString) return null

  const date = new Date(dateString)
  const day: number = date.getDate()
  const month: number = date.getMonth() + 1
  const year: number = date.getFullYear()

  // Pad single digit day or month with leading zero
  const formattedDay: string = day < 10 ? `0${day}` : `${day}`
  const formattedMonth: string = month < 10 ? `0${month}` : `${month}`

  return `${formattedDay}-${formattedMonth}-${year}`
}
