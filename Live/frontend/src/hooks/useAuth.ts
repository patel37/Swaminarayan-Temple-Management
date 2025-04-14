import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import {
  type Body_login_login_access_token as AccessToken,
  type ApiError,
  LoginService,
  type UserOut,
  UsersService,
} from "../client"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

// const useAuth = () => {
//   const [error, setError] = useState<string | null>(null)
//   const navigate = useNavigate()
//   const { data: user, isLoading } = useQuery<UserOut | null, Error>({
//     queryKey: ["currentUser"],
//     queryFn: UsersService.readUserMe,
//     enabled: isLoggedIn(),
//   })

//   const login = async (data: AccessToken) => {
//     const response = await LoginService.loginAccessToken({
//       formData: data,
//     })
//     console.log("response-----", response)
//     if(response.error){
//       setError(response.error.message)
//       return
//     }
//     localStorage.setItem("access_token", response.data.access_token)
//     localStorage.setItem("api_key_user", response.data.user_id)
//   }

//   const loginMutation = useMutation({
//     mutationFn: login,
//     onSuccess: () => {
//       navigate({ to: "/" })
//     },
//     onError: (err: ApiError) => {
//       console.log("onError-- login---", err)
//       const errDetail = (err.body as any)?.error.message
//       setError(errDetail)

//       // const errDetail =(err.body as any)?.error.message
//       // console.log("errDetail-----",errDetail)
//       // showToast("Something went wrong.", `${errDetail}`, "error")
//     },
//   })

//   const logout = () => {
//     localStorage.removeItem("access_token")
//     navigate({ to: "/login" })
//   }

//   return {
//     loginMutation,
//     logout,
//     user,
//     isLoading,
//     error,
//   }
// }
const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery<UserOut | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  });

  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      formData: data,
    });

    if (response.error) {
      setError(response.error.message);
      return;
    }

    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("api_key_user", response.data.user_id);
    localStorage.setItem("user_role", response.data.user_type); // Store user role

    // Navigate based on role
    if (response.data.user_type === "admin") {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/haribhagat" });
    }
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Additional success logic
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.error.message;
      setError(errDetail);
    },
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("api_key_user");    
    localStorage.removeItem("user_role"); // Clear role on logout
    navigate({ to: "/login" });
  };

  return {
    loginMutation,
    logout,
    user,
    isLoading,
    error,
  };
};


export { isLoggedIn }
export default useAuth

