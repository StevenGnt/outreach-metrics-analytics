const fs = require('fs')

const { analyticsFields } = require('./constants');
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
        'First Contacted': firstContacts,
        'Prospect First Reply': firstContactsReplies,
        'Casual Call Attended': casualCallsAttended,
        'Casual Call Booked': casualCallsBooked,
        'Proof Session Attended': proofSessionsAttended,
        'Proof Session Booked': proofSessionsBooked,
    } = analytics;

    return {
        'Response rate': getAnalytyicsPercentage(firstContactsReplies, firstContacts),
        'Attendance rate': getAnalytyicsPercentage(casualCallsAttended, casualCallsBooked),
        'Proof session rate': getAnalytyicsPercentage(proofSessionsAttended, proofSessionsBooked)
    };
}

/**
 * Get the interesting data analytics
 * @param {array} rows
 * @returns {object}
 */
function getAnalytics(rows) {
    const collectedFields = [
        'First Contacted',
        'Prospect First Reply',
        'Casual Call Booked',
        'Casual Call Attended',
        'Proof Session Booked',
        'Proof Session Attended',
    ];

    const byWeek = {};

    const getDefaultAnalytics = () => {
        return collectedFields.reduce(
            (acc, fieldName) => ({ ...acc, [fieldName]: 0 }),
            {}
        );
    }

    rows.forEach(row => {
        if (!row['First Contacted']) {
            return;
        }

        const weekKey = getWeekKey(row['First Contacted']);

        const currentWeekStats = byWeek[weekKey] || getDefaultAnalytics();

        // currentWeekStats.firstContacts++;

        collectedFields.forEach(fieldName => {
            if (row[fieldName]) {
                currentWeekStats[fieldName]++;
            }
        });

        byWeek[weekKey] = currentWeekStats;
    });

    // Build total stats
    const totalAnalytics = Object.keys(byWeek).reduce((acc, weekKey) => {
        collectedFields.forEach(fieldName => {
            acc[fieldName] = (acc[fieldName] || 0) + byWeek[weekKey][fieldName];
        });

        return acc;
    }, getDefaultAnalytics());

    // Metadata
    Object.keys(byWeek).forEach(weekKey => {
        byWeek[weekKey] = { ...byWeek[weekKey], ...getMetadata(byWeek[weekKey]) };
    });

    Object.assign(totalAnalytics, getMetadata(totalAnalytics));

    return { byWeek, totalAnalytics };
}

function saveAnalyticsCsv(analytics, filename) {
    const rows = [['Date', ...analyticsFields]];

    Object.keys(analytics.byWeek)
        .sort()
        .reverse()
        .forEach(weekKey => {
            rows.push([weekKey, ...Object.values(analytics.byWeek[weekKey])]);
        });

    rows.push(['Total', ...Object.values(analytics.totalAnalytics)]);

    const csvOutput = rows.map(entries => entries.join(';')).join('\n');

    return new Promise((resolve, reject) => {
        fs.writeFile(filename, csvOutput, (err) => {
            err
                ? reject(err)
                : resolve();
        });

    });
}

module.exports = { getAnalytics, saveAnalyticsCsv };