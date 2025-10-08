//@ts-check
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import global from "./global.js";
import logtail from "./logs/logtail.js"

// Result Class
class Result{
    
    /** Result details regarding a database function attempt.
     * @param {{success: boolean, data?: any | null, error?: {reason?: string, rawError?: Error | unknown} | null}} options
     */
    constructor({success, data = null, error = null}) {
        this.success = success
        this.data = data
        this.error = error
    }

    /** Error details regarding failed database function.
     * @param {string} reasonString 
     * @param {Error} rawError
     */
    static error(reasonString, rawError) {
            return {reasonString, rawError}
    }
}


//+ Default Export:
/** Utility module for performing specific database functions */
export default {

    /** Increment Global Counters */
    globalCounters: {
        /** Increment Global Sessions Created 
         * @param {number} increase
        */
        incrementSessionsCreated: async (increase) => { try {
            // Increase count within database:
            const incrementResult = await db.collection('events').doc('sessionsCreated').update({
                allTime : FieldValue.increment(increase)
            })
            // Return Result:
            return new Result({success: true, data: {writeTime: incrementResult.writeTime}})

        } catch (err) {
            //Return/Log Error:
            logtail.warn('[!] Failed to increase "sessionsCreated" global counter..', {increaseLost: increase, rawError: err})
            return new Result({success: false, error: {reason: "Failed to save/increment database value!", rawError: err}})
        }},

        /** Increment Global Roles Assigned 
         * @param {number} increase
        */
        incrementRolesAssigned: async (increase) => { try {
            // Increase count within database:
            const incrementResult = await db.collection('events').doc('rolesAssigned').update({
                allTime : FieldValue.increment(increase)
            })
            // Return Result:
            return new Result({success: true, data: {writeTime: incrementResult.writeTime}})

        } catch (err) {
            //Return/Log Error:
            logtail.warn('[!] Failed to increase "rolesAssigned" global counter..', {increaseLost: increase, rawError: err})
            return new Result({success: false, error: {reason: "Failed to save/increment database value!", rawError: err}})
        }},
    }

    

}
