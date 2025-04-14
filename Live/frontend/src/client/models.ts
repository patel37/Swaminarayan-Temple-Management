export type Body_login_login_access_token = {
    grant_type?: string | null;
    username: string;
    password: string;
    scope?: string;
    client_id?: string | null;
    client_secret?: string | null;
};



export type HTTPValidationError = {
    detail?: Array<ValidationError>;
};

export type ItemSabha = {
    id: string;
    pagination:string;
    sabha_id: string;
    sabha_name: string;
    sabha_date: string | null;
    from_time: Date;
    attendees: Array<{id:string}>;
    to_time: Date;
};

export type SabhaOut = {
    id: string;
    pagination:string;
    sabha_id: string;
    sabha_name: string;
    sabha_date: string | null;
    from_time: Date;
    to_time: Date;
};

export type sabhaUpdate = {
    id: string;
    pagination:string;
    sabha_id: string;
    sabha_name: string;
    sabha_date: string | null;
    from_time: Date;
    to_time: Date;
};


export type ItemCreate = {
    // description?: string | null;
    haribhagat_id: string;
    surname: string;
    first_name: string;
    middle_name: string;
    gender: string;
    number_of_family_member: Number;
    address: string;
    house_no: string;
    street: string;
    landmark: string;
    native_place: String, 
    post_office: string;
    area: string;
    district: string;
    sub_district: string;
    state: string;
    email: string;
    mobile_country_code: string;
    mobile: string;
    pin_code: BigInteger;
    note: string;
    admin_id: string;
    birth_date: string | null;
    profile_picture_base63: string | null;
    anniversary_date: string | null;
    description?: (string | null);
    is_own_home: boolean,
    is_memeber_of_land_donation: boolean,
    is_member_of_other_donation: boolean,
    is_memeber_of_sahajanadi_sabha: boolean,
    business_name: string,
};



export type ItemOut = {
    // title: string;
    // description?: string | null;
    total_sabha_count:number
    attended_sabhas: number
    total_sabha: number | null;
    success: boolean;
    message: string;
    pagination: string;
    sabha_id: string;
    haribhagat_id: string;
    surname: string;
    first_name: string;
    middle_name: string;
    gender: string;
    address: string;
    house_no: string;
    street: string;
    landmark: string;
    native_place : string;
    post_office: string;
    area: string;
    district: string;
    number_of_family_member: Number;
    sub_district: string;
    state: string;
    email: string;
    mobile_country_code: string;
    profile_picture: string;
    mobile: string;
    pin_code: BigInteger;
    note: string;
    is_verified:boolean;
    admin_id: string;
    birth_date: string | null;
    anniversary_date: string | null;
    description?: (string | null);
    is_own_home: boolean,
    family_id: string;
    Blob: string;
    is_memeber_of_land_donation: boolean,
    is_member_of_other_donation: boolean,
    is_memeber_of_sahajanadi_sabha: boolean,
    business_name: string,
};



export type ItemUpdate = {
    haribhagat_id: string;
    surname: string;
    first_name: string;
    middle_name: string;
    is_verified:Boolean;
    gender: string;
    address: string;
    house_no: string;
    street: string;
    landmark: string;
    native_place : string;
    post_office: string;
    area: string;
    district: string;
    number_of_family_member: Number;
    sub_district: string;
    state: string;
    email: string;
    mobile_country_code: string;
    mobile: string;
    pin_code: BigInteger;
    note: string;
    admin_id: string;
    birth_date: string | null;
    anniversary_date: string | null;
    profile_picture_base63: string | null;
    description?: (string | null);
    is_own_home: boolean,
    is_memeber_of_land_donation: boolean,
    is_member_of_other_donation: boolean,
    is_memeber_of_sahajanadi_sabha: boolean,
    business_name: string,
};



export type ItemsOut = {
    data: Array<ItemOut>;
    count: number;
};

export type HaribhagatOut = {
    haribhagat_id: string;
    surname: string;
    first_name: string;
    middle_name: string;
    mobile_country_code: string;
    mobile: string;
    email: string;
    birth_date: string | null;
};

export type AttendanceListOut = {
    data: {
        pagination: {
            totalRecords: number,
            totalPages: number,
            currentPage: number
        }, data: Array<ItemOut>
    };
    count: number;
};



export type Message = {
    message: string;
};



export type NewPassword = {
    token: string;
    new_password: string;
};



export type Token = {
    access_token: string;
    token_type?: string;
    user_id: string;
    user_type:string;
};



export type UpdatePassword = {
    current_password: string;
    new_password: string;
};



export type UserCreate = {
    email: string;
    is_active?: boolean;
    is_superuser: "admin" | "user" | "sub-user";
    first_name?: string | null;
    mobile_country_code?:string;
    mobile?:number;
    password: string;
};

export type ItemsSabha = {
    data: Array<ItemSabha>;
    count: number;
}



export type sabhasUpdate = {
    data: Array<sabhaUpdate>;
    count: number;
};

export type UserOut = {
    email: string;
    is_active?: boolean;
    is_superuser: "admin" | "user" | "sub-user";
    user_type:string;
    role: "admin" | "user" | "sub-user";
    first_name?: string | null;
    mobile?:string;
    id: number;
    status: "Active" | "Inactive" | "Pending";
    // haribhagat_id: string;
};



export type UserRegister = {
    email: string;
    password: string;
    full_name?: string | null;
};



export type UserUpdate = {
    mobile_country_code?:string;
    mobile?:number;
    email?: string | null;
    is_active?: boolean;
    is_superuser: "admin" | "user" | "sub-user";
    first_name?: string | null;
    password?: string | null;
};



export type UserUpdateMe = {
    full_name?: string | null;
    email?: string | null;
};



export type UsersOut = {
    data: Array<UserOut>;
    count: number;
};



export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type DashboardCount = {
    last_sabha_attendees:Number;
    total_haribhagat: Number;
    total_family_members: Number;
    total_monthly_donated: Number;
    upcoming_birthdays: Number;
    total_sabha: Number;
    new_attendees_count: Number;
    last_sabha_id:number;
    

};

export type DashbaordsOut = {
    data: DashboardCount;
    count?: number;
};