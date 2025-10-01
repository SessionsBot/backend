import axios from "axios";
import logtail from "../../../../utils/logs/logtail.js";
const BETTERSTACK_KEY = process.env?.['BETTERSTACK_KEY'];


/** Utility function to retrieve current system status(es) from Better Stack. */
export async function checkSystemStatuses() { 
    try {
        // Send HTTP request
        const results = await axios.get('https://uptime.betterstack.com/api/v2/status-pages/224053/resources', {
            headers: {
                Authorization: `Bearer ${BETTERSTACK_KEY}`
            }
        })
        // Confirm response data
        if (!results.data) throw {message: `No response/status data received!`};
        const resources = results.data?.data; // Array of resources data
        if(!resources) throw {message: `Couldn't find status page resources! Please try again... | ${results?.data}`};

        let statuses = [];
        let allSystemsOperational = true
        // Extract resource/status data from each:
        resources.forEach(resource => {
            let newStatus = {
                id: resource?.id,
                name: resource?.attributes?.public_name,
                status: resource?.attributes?.status
            }
            if(newStatus.status != 'operational') {
                allSystemsOperational = false;
            }
            statuses.push(newStatus);
        });
        return {success: true, data: {allSystemsOperational ,statuses}}

    } catch(e){ // Error occurred:
        // Debug & Store Log:
        logtail.error(`Failed to fetch system statuses!`, {fetchAttemptData: e.response?.data || e.message || e});
        return {success: false, data: {message: e.response?.data || e.message}}
    }
}