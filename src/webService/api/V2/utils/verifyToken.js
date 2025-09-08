// Imports

const JWT_KEY = process.env['JSON_WEBTOKEN_SECRET'];
import jwt from "jsonwebtoken";
import responder from "./responder.js";
// import { DecodedUserData } from "@sessionsbot/api-types";


/** __Utility function used to verify and decode a users authentication token.__
 * 1. Checks inside original request for required authentication token.
 * 2. Verifies token exists and isn't expired
 * 
 * **Valid Token**: Executes function (next) from API call.
 * - Attaches `user` object to `req` included decoded user data.
 *
 * **Invalid Token**: Stops execution and responds to API call with permission errors.
 * 
 * @param {Request} req Original request object from API call.
 * @param {Response} res Original response object from API call.
 * @param {NextFunction} next The function/execution from API call.
 */
const verifyToken = (req, res, next) => {
    const token = req.headers?.authorization?.split(' ')[1];
    if(!token) return responder.errored(res, 'Invalid Permissions - An authentication token was not provided!', 401);

    // Decode and verify user from token:
    try {
        const decoded = jwt.verify(token, JWT_KEY);
        req['user'] = decoded // Attach decoded user data to request
        next() // Allow request
    } catch (err) {
        if (err?.name === 'TokenExpiredError') {
            // User's auth token is expired:
            return responder.errored(res, `Invalid Permissions - Authentication token is expired! - Exp: ${err?.expiredAt}`, 403)
        }
        if (err?.name === 'JsonWebTokenError') {
            // User's auth token is invalid:
            return responder.errored(res, `Invalid Permissions - Authentication token is invalid!`, 403)
        }
        // Unknown error occurred:
        return responder.errored(res, 'Auth Token Verification - Unknown Error', 500)
    }
}

// Export:
export default verifyToken