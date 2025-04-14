import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import axios from 'axios';

import type { Body_login_login_access_token, Message, NewPassword, Token, UserOut, sabhasUpdate, UpdatePassword, UserCreate, UserRegister, UsersOut, UserUpdate, UserUpdateMe, ItemCreate, ItemSabha, ItemsSabha, ItemOut, ItemsOut, ItemUpdate, DashbaordsOut, AttendanceListOut, HaribhagatOut, SabhaOut, sabhaUpdate } from './models';

export type TDataLoginAccessToken = {
	formData: Body_login_login_access_token

}
export type TDataRecoverPassword = {
	email: string

}
export type TDataResetPassword = {
	requestBody: NewPassword

}
export type TDataRecoverPasswordHtmlContent = {
	email: string

}
interface ApiRequestOptions {
    method: string;
    url: string;
    query?: Record<string, any>;
    responseType?: 'blob' | 'json' | 'text'; // Add responseType here if it's not already present
    errors?: Record<number, string>;
}
export class LoginService {

	/**
	 * Login Access Token
	 * OAuth2 compatible token login, get an access token for future requests
	 * @returns Token Successful Response
	 * @throws ApiError
	 */
	public static loginAccessToken(data: TDataLoginAccessToken): CancelablePromise<{
		error: any; data: Token
	}> {
		const {
			formData,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/loginweb',
			formData: formData,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Test Token
	 * Test access token
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static testToken(): CancelablePromise<UserOut> {
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/login/test-token',
		});
	}

	/**
	 * Recover Password
	 * Password Recovery
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static recoverPassword(data: TDataRecoverPassword): CancelablePromise<Message> {
		const {
			email,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/password-recovery/{email}',
			path: {
				email
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Reset Password
	 * Reset password
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static resetPassword(data: TDataResetPassword): CancelablePromise<Message> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/reset-password/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Recover Password Html Content
	 * HTML Content for Password Recovery
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static recoverPasswordHtmlContent(data: TDataRecoverPasswordHtmlContent): CancelablePromise<string> {
		const {
			email,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/password-recovery-html-content/{email}',
			path: {
				email
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadUsers = {
	limit?: number
	skip?: number

}
export type TDataCreateUser = {
	requestBody: UserCreate

}
export type TDataUpdateUserMe = {
	requestBody: UserUpdateMe

}
export type TDataUpdatePasswordMe = {
	requestBody: UpdatePassword

}
export type TDataRegisterUser = {
	requestBody: UserRegister

}
export type TDataReadUserById = {
	userId: number

}
export type TDataUpdateUser = {
	requestBody: UserUpdate
	userId: number

}
export type TDataDeleteUser = {
	userId: number

}

export class UsersService {

	/**
	 * Read Users
	 * Retrieve users.
	 * @returns UsersOut Successful Response
	 * @throws ApiError
	 */
	public static readUsers(data: TDataReadUsers = {}): CancelablePromise<UsersOut> {
		const {
			limit = 100,
			skip = 0,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/get-admin/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
	public static getviewpage(data: { user_id: string }): CancelablePromise<UsersOut> {
		return __request(OpenAPI, {
		  method: 'POST',
		  url: '/api/admin/get-admin',
		  body: { user_id: data.user_id },
		  errors: {
			422: `Validation Error`,
		  },
		});
	  }
	  
	
	/**
	 * Create User
	 * Create new user.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static createUser(data: TDataCreateUser): CancelablePromise<UserOut> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/create-admin/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read User Me
	 * Get current user.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static readUserMe(): CancelablePromise<UserOut> {
		console.log("OpenAPI", OpenAPI)
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/get-admin-profile',
			body: { "admin_id": localStorage.getItem('api_key_user') },
		});
	}

	/**
	 * Update User Me
	 * Update own user.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static updateUserMe(data: TDataUpdateUserMe): CancelablePromise<UserOut> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/update-admin-profile',
			body: {...requestBody,  "admin_id": localStorage.getItem('api_key_user')},
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}


	/**
	 * Update Password Me
	 * Update own password.
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static updatePasswordMe(data: TDataUpdatePasswordMe): CancelablePromise<Message> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/admin-change-password',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Register User
	 * Create new user without the need to be logged in.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static registerUser(data: TDataRegisterUser): CancelablePromise<UserOut> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/get-admin',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read User By Id
	 * Get a specific user by id.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static readUserById(data: TDataReadUserById): CancelablePromise<UserOut> {
		const {
			userId,
		} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/admin/get-admin/{user_id}',
			path: {
				user_id: userId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update User
	 * Update a user.
	 * @returns UserOut Successful Response
	 * @throws ApiError
	 */
	public static updateUser(data: TDataUpdateUser): CancelablePromise<UserOut> {
		const {
			requestBody,
			userId,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/update-admin/{user_id}',
			path: {
				user_id: userId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}
	public static getupdate(data: { user_id: string }): CancelablePromise<UsersOut> {
		return __request(OpenAPI, {
		  method: 'POST',
		  url: '/api/admin/update-admin/{user_id}',
		  body: { user_id: data.user_id },
		  errors: {
			422: `Validation Error`,
		  },
		});
	  }
	/**
	 * Delete User
	 * Delete a user.
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static deleteUser(data: TDataDeleteUser): CancelablePromise<Message> {
		const {
			userId,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/delete-account/{user_id}',
			path: {
				user_id: userId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
}

export type TDataTestEmail = {
	emailTo: string

}

export class UtilsService {

	/**
	 * Test Email
	 * Test emails.
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static testEmail(data: TDataTestEmail): CancelablePromise<Message> {
		const {
			emailTo,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/utils/test-email/',
			query: {
				email_to: emailTo
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadItems = {
	page?: number;
	limit?: number
	skip?: number
	is_memeber_of_land_donation?: boolean,
	is_member_of_other_donation?: boolean,
	upcoming_birthdays?: boolean
	haribhagat_id?: string
	search?: string
	birthday_limit_days?: number
}
export type TDataDupalicat = {
	haribhagat_id?: string
}

export type TDataHaribhagatDetails = {
	haribhagat_id: string
}
export type TDataAdminDetails = {
	user_id: string
}
export type TDataHaribhagatUpdate = {
	haribhagat_id: string
}

export type TDataCreateItem = {
	requestBody: ItemCreate

}

export type TDataSabhaItem = {
	requestBody: ItemSabha
}

export type TDataReadItem = {
	id: number

}
export type TDataupdetesabha = {
	haribhagat_id: Object
	sabha_id: string;
}
export interface UpdatePDFViewRequest {
	id: string;
	pdfViewPreference: string;
}

export type TDataUpdateItem = {
	haribhagat_id: string
	requestBody: ItemUpdate

}

export type TDataUpdateSabha = {
	sabha_id: string
	requestBody: sabhaUpdate

}
export type TDataDeleteItem = {
	id: string
}

export class serviceSabha {

	/**
	 * Read Items
	 * Retrieve items.
	 * @returns ItemsOut Successful Response
	 * @throws ApiError
	 */
	// public static readSabha(data: TDataReadItems = {}): CancelablePromise<ItemsSabha> {
	// 	const {
	// 		limit = 10,
	// 		skip = 0,
	// 	} = data;
	// 	return __request(OpenAPI, {
	// 		method: 'POST',
	// 		url: '/api/sabha/get-sabha',
	// 		query: {
	// 			skip, limit
	// 		},
	// 		errors: {
	// 			422: `Validation Error`,
	// 		},
	// 	});
	// }
	public static readSabha(data: {
		page?: number;
		limit?: number;
		sabha_id?: string;
		search?: string;
		sort_key?: string;
		sort_order?: 'asc' | 'desc';
	} = {}): CancelablePromise<ItemsSabha> {
		const {
			page = 1, 
			limit = 10, 
			sabha_id, 
			search, 
			sort_key = 'sabha_id', // Set default sort key
			sort_order = 'asc' // Set default sort order
		} = data;
		
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/sabha/get-sabha',
			query: {
				page,
				limit,
				sabha_id,
				search,
				sort_key, // Include sort_key in the query
				sort_order, // Include sort_order in the query
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
	
	/**
		 * Get Sabha Count
		 * Get the count of Sabha items for a given date range.
		 * @param start_date - Start date of the range (format: yyyy-mm-dd)
		 * @param end_date - End date of the range (format: yyyy-mm-dd)
		 * @returns number - Sabha count for the given date range
		 * @throws ApiError
		 */
	public static async getSabhaCount(data: {
		start_date: string;
		end_date: string;	
		printPdf?: boolean;
		gender?: string;
	}): Promise<CancelablePromise<{ sabhaCount: { _id: number; haribhagatCount: number; }[]; nonAttendees: number; }>> {
		const { start_date, end_date, printPdf,gender } = data;
		if (printPdf) {
			const headers = {
				'x-access-token': `Bearer ${localStorage.getItem('access_token')}`,
				'x-api-key': `${localStorage.getItem('api_key_user')}`,
			};
	
			const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sabha/get-sabha-count`, {
				params: {
					printPdf: true,
					start_date,
					end_date,
					gender,
					admin_id:localStorage.getItem('api_key_user'),
				},
				responseType: 'blob', // Important for handling binary data
				headers: headers, // Include headers here
			});
	
			// Create a URL for the PDF blob
			const url = window.URL.createObjectURL(new Blob([response.data]));
	
			// Create a link element
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `${gender}_haribhagat_list_${start_date}_to_${end_date}.pdf`); // Set filename
	
			// Append to the body and trigger click
			document.body.appendChild(link);
			link.click();
	
			// Clean up
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);
	
			// If you want to handle the response further (when not printing PDF)
			if (!response) {
				console.log('PDF download triggered');
			} else {
				// Handle normal response if needed
			}
		}
		
	
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/sabha/get-sabha-count',
			query: {
				start_date,
				end_date,
			},
			errors: {
				422: `Validation Error`,
			},
		}).then(response => {
			// Here, we handle the response based on the structure you provided
			return {
				sabhaCount: response.data.sabhaCount,
				nonAttendees: response.data.nonAttendees,
			};
		});
	}
	


	public static getHaribhagt(data: { page?: number; limit?: number; sabha_id?: string; search?: string; pagination?: string; sort_key?: string;
		sort_order?: 'asc' | 'desc'; only_present : boolean;} = {
			only_present: false
		}): CancelablePromise<ItemsOut> {
		const { page = 1, limit = 10, sabha_id, search, pagination,sort_key = 'sabha_id', // Set default sort key
			sort_order = 'asc', only_present=true } = data;
		return __request(OpenAPI, {
			method: 'GET', // Use GET for fetching data
			url: '/api/sabha/get-haribhagat-by-sabhaid',
			query: {
				page,
				limit,
				sabha_id,
				search,
				pagination,
				sort_key, // Include sort_key in the query
				sort_order,
				only_present,
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
	/**
	 * Create Item
	 * Create new item.
	 * @returns ItemOut Successful Response
	 * @throws ApiError
	 */
	public static sabhaItem(data: TDataSabhaItem): CancelablePromise<ItemSabha> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/sabha/create-sabha',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	public static updateSabha(data: TDataUpdateSabha): CancelablePromise<SabhaOut> {
		const {
			sabha_id,
			requestBody,
		} = data;
		console.log("data",data)
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/sabha/updates-sabha',
			path: {
				sabha_id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}
	

	public static deleteSabha(data: TDataSabhaItem): CancelablePromise<Message> {
		const { id } = data;
		return __request(OpenAPI, {
			method: 'POST',
			body: [id],  // Sending an array with the sabha_id to delete
			url: '/api/sabha/delete-sabha',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
	
}

export class AdminService {

	public static updatePDFViewSettings(
		data: UpdatePDFViewRequest
	): CancelablePromise<ItemsOut> {
		const { id, pdfViewPreference } = data;

		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/admin/update-PDFview',
			body: { id, pdfViewPreference },
			errors: {
				422: `Validation Error`,
			},
		});
	}
}

export class ItemsService {
	
	public static readItems(data: TDataReadItems = {}): CancelablePromise<ItemsOut> {
		const {
			limit = 10,
			skip = 0,
			is_memeber_of_land_donation = false,
			upcoming_birthdays = false,
			birthday_limit_days,
			page = 1
		} = data;

		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/haribhagat/get-haribhagat',
			query: {
				skip,
				limit,
				is_memeber_of_land_donation,
				upcoming_birthdays,
				birthday_limit_days,
				page,
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}
	// public static duplication(data: TDataDupalicat = {}): CancelablePromise<ItemsOut> {
	// 	const {
	// 		haribhagat_id
	// 	} = data;
	// 	console.log("data",data)

	// 	return __request(OpenAPI, {
	// 		method: 'POST',
	// 		url: '/api/haribhagat/duplication-recored',
	// 		body:{
	// 			haribhagat_id,
	// 				},
	// 		errors: {
	// 			422: `Validation Error`,
	// 		},
	// 	});
	// }


	// public static getHaribhagtid(data: { page?: number; limit?: number; sort?:string; search?: string;printPdf?:boolean;pdfType?:string; } = {}): CancelablePromise<HaribhagatOut> {
	// 	const { page = 1, limit = 10, search ,sort,printPdf,pdfType} = data;
	// 	return __request(OpenAPI, {
	// 	  method: 'GET',
	// 	  url: '/api/haribhagat/get-haribhagat-by-haribhagatid',
	// 	  query: {
	// 		page,
	// 		limit,
	// 		sort,
	// 		search,
	// 		printPdf,
	// 		pdfType
	// 	  },
	// 	  errors: {
	// 		422: `Validation Error`,
	// 	  },
	// 	});
	//   }
	// public static getHaribhagtid(data: { 
	// 	page?: number; 
	// 	limit?: number; 
	// 	sort?: string; 
	// 	search?: string; 
	// 	printPdf?: boolean; 
	// 	pdfType?: string; 
	//   } = {}): CancelablePromise<HaribhagatOut> {
	// 	const { page = 1, limit = 10, search, sort, printPdf, pdfType } = data;
	// 	return __request(OpenAPI, {
	// 	  method: 'GET',
	// 	  url: '/api/haribhagat/get-haribhagat-by-haribhagatid',
	// 	  query: {
	// 		page,
	// 		limit,
	// 		sort,
	// 		search,
	// 		printPdf,
	// 		pdfType
	// 	  },
	// 	  errors: {
	// 		422: `Validation Error`,
	// 	  },
	// 	});
	//   }

	// Ensure this interface is available in the same file or imported correctly

	public static duplication(data: TDataDupalicat): CancelablePromise<ItemsOut> {
		const { haribhagat_id } = data || {};
		if (!haribhagat_id) {
		  console.error("Missing haribhagat_id:", haribhagat_id);
		  throw new Error("haribhagat_id is required");
		}
	  
		return __request(OpenAPI, {
		  method: 'POST',
		  url: '/api/haribhagat/duplication-recored',
		  body: {
			haribhagat_id,
		  },
		  errors: {
			422: `Validation Error`,
		  },
		});
	  }
	  
	  

	public static getHaribhagtid3(data: {
		page?: number;
		limit?: number;
		search?: string;
		sort_key?: string;
		sort_order?: "asc" | "desc";
		printPdf?: boolean;
		pdfType?: string;
	} = {}): CancelablePromise<Blob> {
		const {
			page = 1,
			limit = 10,
			search,
			sort_key,
			sort_order,
			printPdf,
			pdfType
		} = data;
	
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/haribhagat/get-haribhagat-by-haribhagatid',
			query: {
				page,
				limit,
				search,
				sort_key,
				sort_order,
				printPdf,
				pdfType
			},
			responseType: 'blob', // Ensure this is set
			errors: {
				422: `Validation Error`,
			},
		});
		
	}

	// public static async getHaribhagtid(data: {
	// 	page?: number;
	// 	limit?: number;
	// 	search?: string;
	// 	sort_key?: string;
	// 	sort_order?: "asc" | "desc";
	// 	printPdf?: boolean;
	// 	pdfType?: string;
	// } = {}): Promise<CancelablePromise<Blob | void>> {
	// 	const {
	// 		page = 1,
	// 		limit = 10,
	// 		search,
	// 		sort_key,
	// 		sort_order,
	// 		printPdf,
	// 		pdfType
	// 	} = data;
	// 	if (printPdf) {
	// 		const headers = {
	// 			'x-access-token': `Bearer ${localStorage.getItem('access_token')}`,
	// 			'x-api-key': `${localStorage.getItem('api_key_user')}`,
	// 		};
	// 		const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/haribhagat/get-haribhagat-by-haribhagatid`, {
	// 			params: {
	// 				printPdf: true,
	// 				page: '1',
	// 				search,
	// 				sort_key,
	// 				sort_order,
	// 				pdfType,
	// 				is
	// 			},
	// 			responseType: 'blob', // Important for handling binary data
	// 			headers: headers, // Include headers here
	// 		});
			  
	// 		  // Create a URL for the PDF blob
	// 		  const url = window.URL.createObjectURL(new Blob([response.data]));
		
	// 		  // Create a link element
	// 		  const link = document.createElement('a');
	// 		  link.href = url;
	// 		  link.setAttribute('download', 'haribhagat_list.pdf'); // Set filename
		
	// 		  // Append to the body and trigger click
	// 		  document.body.appendChild(link);
	// 		  link.click();
		
	// 		  // Clean up
	// 		  link.parentNode.removeChild(link);
	// 		  window.URL.revokeObjectURL(url);
			
			
	// 		// If you want to handle the response further (when not printing PDF)
	// 		if (!response) {
	// 			console.log('PDF download triggered');
	// 		} else {
	// 			// Handle normal response if needed
	// 		}
			  
	// 	}
	
	// 	const requestOptions: ApiRequestOptions = {
	// 		method: 'GET',
	// 		url: '/api/haribhagat/get-haribhagat-by-haribhagatid',
	// 		query: {
	// 			page,
	// 			limit,
	// 			search,
	// 			sort_key,
	// 			sort_order,
	// 			printPdf,
	// 			pdfType,
	// 			is_verified,
	// 		},
	// 		responseType: 'blob', // Ensure this is set for blob response
	// 		errors: {
	// 			422: `Validation Error`,
	// 		},
	// 	};
	
	// 	return __request<Blob | void>(OpenAPI, requestOptions) // Use request function
	// 		.then(response => {
	// 			return response; // Return the response for other usages
	// 		});
	// }
	public static async getHaribhagtid(data: {
		page?: number;
		limit?: number;
		search?: string;
		haribhagatId?: number
		sort_key?: string;
		sort_order?: "asc" | "desc";
		printPdf?: boolean;
		gender?: "Male" | "Female";
		pdfType?: string;
		is_verified?: string;
		is_memeber_of_sahajanadi_sabha?: boolean;
	} = {}): Promise<CancelablePromise<Blob | void>> {
		const {
			page = 1,
			limit = 10,
			search,
			sort_key,
			sort_order,
			printPdf,
			pdfType,
			gender,
			haribhagatId,
			is_verified = true,
			is_memeber_of_sahajanadi_sabha,
		} = data;
		// const validGenders = ['Male', 'Female'];
		// if (gender && !validGenders.includes(gender.toLowerCase())) {
		//   throw new Error("Invalid gender value. Allowed values are 'male', 'female', 'other'.");
		// }
		if (printPdf) {
			const headers = {
				'x-access-token': `Bearer ${localStorage.getItem('access_token')}`,
				'x-api-key': `${localStorage.getItem('api_key_user')}`,
			};
	
			const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/haribhagat/get-haribhagat-by-haribhagatid`, {
				params: {
					printPdf: true,
					page: '1',
					search,
					sort_key,
					sort_order,
					pdfType,
					gender,
					haribhagatId,
					is_verified, // Add is_verified here
					is_memeber_of_sahajanadi_sabha,
					admin_id:localStorage.getItem('api_key_user'),
				},
				responseType: 'blob', // Important for handling binary data
				headers: headers, // Include headers here
			});
	
			// Create a URL for the PDF blob
			const url = window.URL.createObjectURL(new Blob([response.data]));
	
			// Create a link element
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'haribhagat_list.pdf'); // Set filename
	
			// Append to the body and trigger click
			document.body.appendChild(link);
			link.click();
	
			// Clean up
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);
	
			// If you want to handle the response further (when not printing PDF)
			if (!response) {
				console.log('PDF download triggered');
			} else {
				// Handle normal response if needed
			}
		}
	
		const requestOptions: ApiRequestOptions = {
			method: 'GET',
			url: '/api/haribhagat/get-haribhagat-by-haribhagatid',
			query: {
				page,
				limit,
				search,
				sort_key,
				sort_order,
				printPdf,
				haribhagatId,
				pdfType,
				gender,
				is_verified, // Add is_verified here as well
				is_memeber_of_sahajanadi_sabha,
				admin_id:localStorage.getItem('api_key_user'),
			},
			responseType: 'blob', // Ensure this is set for blob response
			errors: {
				422: `Validation Error`,
			},
		};
	
		return __request<Blob | void>(OpenAPI, requestOptions) // Use request function
			.then(response => {
				return response; // Return the response for other usages
			});
	}
	




	public static getHaribhagatDetailByID(data: TDataHaribhagatDetails = {
		haribhagat_id: ''
	}): CancelablePromise<ItemsOut> {
		const { haribhagat_id
		} = data;
		// console.log("haribhagat_id-------------------", data)
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/haribhagat/get-haribhagat',
			// query: {
			// 	haribhagat_id
			// },
			body: { haribhagat_id: haribhagat_id },
			errors: {
				422: `Validation Error`,
			},
		});
	}



	/**
	 * Create Item
	 * Create new item.
	 * @returns ItemOut Successful Response
	 * @throws ApiError
	 */
	public static createItem(data: TDataCreateItem): CancelablePromise<ItemOut> {
		const {
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/haribhagat/create-haribhagat',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}


	/**
	 * Update Item
	 * Update an item.
	 * @returns ItemOut Successful Response
	 * @throws ApiError
	 */
	public static updateSabha(data: TDataupdetesabha): CancelablePromise<sabhasUpdate> {
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/sabha/attendance',
			body: data,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Item
	 * Get item by ID.
	 * @returns ItemOut Successful Response
	 * @throws ApiError
	 */
	public static readItem(data: TDataReadItem): CancelablePromise<ItemOut> {
		const {
			id,
		} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/haribhagat/hari_bhagat/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Item
	 * Update an item.
	 * @returns ItemOut Successful Response
	 * @throws ApiError
	 */
	public static updateItem(data: TDataUpdateItem): CancelablePromise<ItemOut> {
		const {
			haribhagat_id,
			requestBody,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/haribhagat/update-haribhagat',
			path: {
				haribhagat_id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}


	/**
	 * Delete Item
	 * Delete an item.
	 * @returns Message Successful Response
	 * @throws ApiError
	 */
	public static deleteHaribhagat(data: TDataDeleteItem): CancelablePromise<Message> {
		const {
			id,
		} = data;
		return __request(OpenAPI, {
			method: 'POST',
			body: [id],
			url: '/api/haribhagat/delete-haribhagat',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export class DashboardService {

	/**
	 * get dashbaord
	 * Retrieve count.
	 * @returns dashbaord count Successful Response
	 * @throws ApiError
	 */
	public static getCount(): CancelablePromise<DashbaordsOut> {

		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/dashboard/get-data',
			errors: {
				422: `Validation Error`,
			},
		});
	}


}


