async function startSchedule() {
    const cron = require('node-cron');

    // Create the function you want to run
    const myScheduledFunction = () => {
        console.log('This function is running...');
        // Your function's logic here
    };

    // Schedule the function to run every day at 10:00 AM CST
    cron.schedule('02 2 * * *', myScheduledFunction, {
        scheduled: true,
        timezone: "America/Chicago" // Make sure it's using the correct time zone (CST)
    });

    // Call the function immediately when the bot starts up
    myScheduledFunction();

    console.log('Scheduler started!');

}

// Exports:
module.exports = {
    startSchedule
}