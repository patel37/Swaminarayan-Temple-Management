/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type UserUpdate = {
    email?: (string | null);
    is_active?: boolean;
    is_superuser: "admin" | "user" | "sub-user";
    first_name?: (string | null);
    password?: (string | null);
};
