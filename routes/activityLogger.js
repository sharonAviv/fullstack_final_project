const { addActivity, getActivities } = require('./persist');

// Function to log activities
const logActivity = async (username, type) => {
  try {
    const datetime = new Date().toISOString();
    await addActivity({ datetime, username, type });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Function to read activities
const readActivities = async () => {
  try {
    return await getActivities();
  } catch (error) {
    console.error('Failed to read activities:', error);
    return [];
  }
};

//init(); // Initialize the logger

module.exports = { logActivity, readActivities };
