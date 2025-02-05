const { getWeekKey, getPercentage } = require('./utils');


function getAnalytyicsPercentage(count, total) {
    return total != 0
        ? getPercentage(count, total)
        : '--';

}

/**
 * Build analytics data
 * @param {*} analytics 
 * @returns 
 */
function getMetadata(analytics) {
    const {
        firstContactsReplies,
        firstContacts,
        casualCallsBooked,
        casualCallsAttended,
    } = analytics;

    return {
        responseRate: getAnalytyicsPercentage(firstContactsReplies, firstContacts),
        attendanceRate: getAnalytyicsPercentage(casualCallsAttended, casualCallsBooked)
    };
}

/**
 * Get the interesting data analytics
 * @param {array} rows
 * @returns {object}
 */
function getAnalytics(rows) {
    const byWeek = {};

    rows.forEach(row => {
        if (!row['First Contacted']) {
            return;
        }

        const weekKey = getWeekKey(row['First Contacted']);
        const currentWeekStats = byWeek[weekKey] ||
        {
            firstContacts: 0,
            firstContactsReplies: 0,
            casualCallsBooked: 0,
            casualCallsAttended: 0,
        };

        currentWeekStats.firstContacts++;

        if (row['Prospect First Reply']) {
            currentWeekStats.firstContactsReplies++
        }

        if (row['Casual Call Booked']) {
            currentWeekStats.casualCallsBooked++
        }

        if (row['Casual Call Attended']) {
            currentWeekStats.casualCallsAttended++
        }

        byWeek[weekKey] = currentWeekStats;
    });

    // Build total stats
    const concatenatedProperties = [
        'firstContacts',
        'firstContactsReplies',
        'casualCallsBooked',
        'casualCallsAttended'
    ];

    const totalAnalytics = Object.keys(byWeek).reduce((acc, weekKey) => {
        concatenatedProperties.forEach(property => {
            acc[property] = (acc[property] || 0) + byWeek[weekKey][property];
        });

        return acc;
    }, {});

    // Metadata
    Object.keys(byWeek).forEach(weekKey => {
        byWeek[weekKey] = { ...byWeek[weekKey], ...getMetadata(byWeek[weekKey]) };
    });

    Object.assign(totalAnalytics, getMetadata(totalAnalytics));

    return { byWeek, totalAnalytics };
}

module.exports = { getAnalytics };