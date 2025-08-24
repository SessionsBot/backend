import {  HttpStatusCode  } from "axios";
import type { Response } from "express";

/** Used for sending consistent API responses, for both successful and unsuccessful responses. */
const responder = {

    /** On success, respond to the API request.
     * @param {Response} res The initial response object from the API request.
     * @param {unknown} data Any data/information to include within API response.
     * @param {HttpStatusCode} status The HTTP status code number to include with the response.
     * @returns {import('@sessionsbot/api-types').APIResponse} */
    succeeded: (res:Response, data = {}, status = 200) => {
        return res.status(status).json({
            success: true,
            data,
            error: null
        })
    },

    /** On error, respond to the API request. 
     * @param {Response} res The initial response object from the API request.
     * @param {unknown} message Any data/information to include within API response.
     * @param {HttpStatusCode} status The HTTP status code number to include with the response.
     * @returns {import('@sessionsbot/api-types').APIResponse} */
    errored: (res:Response, message, status = 500) => {
        return res.status(status).json({
            success: false,
            data: null,
            error: { 
                code: status,
                message
            }
        });
    },
}

export default responder