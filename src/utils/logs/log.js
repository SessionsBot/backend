import logtail from "./logtail.js"


export default {

    /** ### ℹ️ Info Level Log
     * `ⓘ This losses trace-ability!`
     * - To be locally logged via `console.log`
     * - To be retained via `logtail.log`
     * @param {string} message General message details of event/log.
     * @param {any} data Any data to include within the event/log.
     */
    info: (message, data) => {
        console.info('(i)', message, data ? data : '')
        logtail.info(message, data ? data : null)
    },

    /** ### ⚠️ Warning Level Log
     * `ⓘ This losses trace-ability!`
     * - To be locally logged via `console.warn`
     * - To be retained via `logtail.warn`
     * @param {string} message General message details of event/log.
     * @param {any} data Any data to include within the event/log.
     */
    warning: (message, data) => {
        console.warn('[!]' ,message, data ? data : '')
        logtail.warn(message, data ? data : null)
    },

    /** ### ⛔️ Error Level Log
     * `ⓘ This losses trace-ability!`
     * - To be locally logged via `console.error`
     * - To be retained via `logtail.error`
     * @param {string} message General message details of event/log.
     * @param {any} data Any data to include within the event/log.
     */
    error: (message, data) => {
        console.error('[!!!]', message, data ? data : '')
        logtail.error(message, data ? data : null)
    },

}