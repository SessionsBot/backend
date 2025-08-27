import axios from "axios";
import logtail from "../../../../utils/logs/logtail.js";
const BETTERSTACK_KEY = process.env?.['BETTERSTACK_KEY'];


/** Utility function to retrieve current system status(es) from Better Stack.
 * 
 * @example ```json
 * {
        "success": true,
        "data": [
            {
                "id": "8608779",
                "name": "sessionsbot.fyi | Website",
                "status": "degraded"
            },
            {
                "id": "8608780",
                "name": "Discord Bot | Backend",
                "status": "downtime"
            },
            {
                "id": "8609073",
                "name": "Hosting Service | Koyeb",
                "status": "operational"
            }
        ],
        "error": null
    }
 * 
 * ```
 */
export async function checkSystemStatuses() { 
    try {
        // Send HTTP request
        const results = await axios.get('https://uptime.betterstack.com/api/v2/status-pages/224053/resources', {
            headers: {
                Authorization: `Bearer ${BETTERSTACK_KEY}`
            }
        })
        // Confirm response data
        if (!results.data) throw {message: `No response data received!`};
        const resources = results.data?.data; // Array of resources data
        if(!resources) throw {message: `Couldn't find status page resources! Please try again... | ${results?.data}`};

        let statuses = [];
        // Extract resource/status data from each:
        resources.forEach(resource => {
            let newStatus = {
                id: resource?.id,
                name: resource?.attributes?.public_name,
                status: resource?.attributes?.status
            }
            statuses.push(newStatus);
        });
        return {success: true, data: statuses}

    } catch(e){ // Error occurred:
        // Debug & Store Log:
        console.log('{!} Failed to fetch system statuses:', e.response?.data || e.message);
        logtail.error(`Failed to fetch system statuses!`, {fetchAttemptData: e.response?.data || e.message});
        return {success: false, data: {message: e.response?.data || e.message}}
    }
}