/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ItemCreate } from '../models/ItemCreate';
import type { ItemOut } from '../models/ItemOut';
import type { ItemsOut } from '../models/ItemsOut';
import type { ItemUpdate } from '../models/ItemUpdate';
import type { Message } from '../models/Message';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ItemsService {

    /**
     * Read Items
     * Retrieve items.
     * @returns ItemsOut Successful Response
     * @throws ApiError
     */
    public static readItems({
skip,
limit = 20,
}: {
skip?: number,
limit?: number,
}): CancelablePromise<ItemsOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: 'haribhagat/get-haribhagat',
            query: {
                'skip': skip,
                'limit': limit,
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
    public static createItem({
    requestBody,
    }: {
    requestBody: ItemCreate,
    }): CancelablePromise<ItemOut> {
            return __request(OpenAPI, {
                method: 'POST',
                url: 'haribhagat/get-haribhagat/',
                body: requestBody,
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
    public static readItem({
id,
}: {
id: number,
}): CancelablePromise<ItemOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/hari_bhagat/{id}',
            path: {
                'id': id,
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
    public static updateItem({
id,
requestBody,
}: {
id: number,
requestBody: ItemUpdate,
}): CancelablePromise<ItemOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/hari_bhagat/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Delete Haribhat
     * Delete an Haibhagat.
     * @returns Message Successful Response
     * @throws ApiError
     */
    public static deleteHaribhagat({
id,
}: {
id: number,
}): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/hari_bhagat/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
