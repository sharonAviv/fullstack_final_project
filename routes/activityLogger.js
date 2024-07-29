const fs = require('fs');
const path = require('path');
const ACTIVITIES_FILE = path.join(__dirname, 'activities.json');

// Ensure the activities file exists
const init = () => {
    if (!fs.existsSync(ACTIVITIES_FILE)) {
        fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify([])); // Initialize with an empty array
    }
};

// Function to log activities
const logActivity = async (username, type) => {
    try {
        const activities = await readActivities();
        const datetime = new Date().toISOString();
        activities.push({ datetime, username, type });
        await fs.promises.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

// Function to read activities from the JSON file
const readActivities = async () => {
    try {
        const data = await fs.promises.readFile(ACTIVITIES_FILE);
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to read activities:', error);
        return [];
    }
};

init(); // Initialize the logger (ensure file exists)

module.exports = { logActivity, readActivities };
