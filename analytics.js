const fs = require('fs')

const cliTable = require('cli-table');

const {
    NOTION_FIELDS,
    NOTION_TAGS,
    ANALYTICS_COLLECTED_FIELDS,
    NOTION_ANALYTICS_FIELDS_MAP,
    ANALYTICS_METADATA_FIELDS,
    OUTPUT_ANALYTICS_FIELDS_ORDER,
} = require('./constants');
const { getWeekKey, getPercentage } = require('./utils');

/**
 *
 * @param {Object} analytics
 * @param {string} countField
 * @param {string} totalField
 * @returns {string}
 */
function getAnalytyicsPercentage(analytics, countField, totalField) {
    const count = analytics[countField];
    const total = analytics[totalField];

    return total != 0
        ? getPercentage(count, total)
        : '--';
}

/**
 * Transform an analytics object into a properly ordered array
 * @param {Object} analyticsRow
 * @returns {Array}
 */
function analyticsRowToArray(analyticsRow) {
    return OUTPUT_ANALYTICS_FIELDS_ORDER.map(key => analyticsRow[key]);
}

/**
 * Build analytics metadata
 * @param {*} analytics 
 * @returns {Object}
 */
function getMetadata(analytics) {
    const {
        FIRST_CONTACTED,
        FIRST_REPLY,
        GOOD_CONVERSATION,
        CC_BOOKED,
        CC_ATTENDED,
        PS_BOOKED,
        PS_ATTENDED,
        SC_BOOKED,
        SC_ATTENDED,
        SALE_CLOSED,
    } = ANALYTICS_COLLECTED_FIELDS;

    return {
        [ANALYTICS_METADATA_FIELDS.RESPONSE_RATE]: getAnalytyicsPercentage(analytics, FIRST_REPLY, FIRST_CONTACTED),
        [ANALYTICS_METADATA_FIELDS.GOOD_CONVERSATION_RATE]: getAnalytyicsPercentage(analytics, GOOD_CONVERSATION, FIRST_CONTACTED),
        [ANALYTICS_METADATA_FIELDS.CC_BOOKING_RATE]: getAnalytyicsPercentage(analytics, CC_BOOKED, FIRST_CONTACTED),
        [ANALYTICS_METADATA_FIELDS.CC_ATTENDANCE_RATE]: getAnalytyicsPercentage(analytics, CC_ATTENDED, CC_BOOKED),
        [ANALYTICS_METADATA_FIELDS.PS_BOOKING_RATE]: getAnalytyicsPercentage(analytics, PS_BOOKED, CC_BOOKED),
        [ANALYTICS_METADATA_FIELDS.PS_ATTENDANCE_RATE]: getAnalytyicsPercentage(analytics, PS_ATTENDED, PS_BOOKED),
        [ANALYTICS_METADATA_FIELDS.SC_BOOKING_RATE]: getAnalytyicsPercentage(analytics, SC_BOOKED, PS_ATTENDED),
        [ANALYTICS_METADATA_FIELDS.SC_ATTENDANCE_RATE]: getAnalytyicsPercentage(analytics, SC_ATTENDED, SC_BOOKED),
        [ANALYTICS_METADATA_FIELDS.SALE_CLOSE_RATE]: getAnalytyicsPercentage(analytics, SALE_CLOSED, SC_ATTENDED),
    };
}

/**
 * Get the interesting data analytics
 * @param {array} rows
 * @returns {object}
 */
function getWeeklyAnalytics(rows) {
    const byWeek = {};

    const getDefaultAnalytics = () => {
        return Object.values(ANALYTICS_COLLECTED_FIELDS).reduce(
            (acc, fieldName) => ({ ...acc, [fieldName]: 0 }),
            {}
        );
    }

    // For each row of the CSV input file, count occurences of fields
    rows.forEach(row => {
        if (!row['First Contacted']) {
            return;
        }

        const weekKey = getWeekKey(row[NOTION_FIELDS.FIRST_CONTACTED]);

        const currentWeekStats = byWeek[weekKey] || getDefaultAnalytics();

        // Auto count fields
        NOTION_ANALYTICS_FIELDS_MAP.forEach(notionField => {
            const { notionFieldName, analyticsCountField } = notionField;

            if (row[notionFieldName]) {
                currentWeekStats[analyticsCountField]++;
            }
        });

        const rowTags = row[NOTION_FIELDS.TAGS] ? row.Tags.split(',') : [];

        // Gond convo
        if (rowTags.includes(NOTION_TAGS.GOOD_CONVERSATION) || !!row[NOTION_FIELDS.CASUAL_CALL_BOOKED]) {
            currentWeekStats[ANALYTICS_COLLECTED_FIELDS.GOOD_CONVERSATION]++;
        }

        byWeek[weekKey] = currentWeekStats;
    });

    // Build total stats
    const allTime = Object.keys(byWeek).reduce((acc, weekKey) => {
        Object.values(ANALYTICS_COLLECTED_FIELDS).forEach(fieldName => {
            acc[fieldName] = (acc[fieldName] || 0) + byWeek[weekKey][fieldName];
        });

        return acc;
    }, getDefaultAnalytics());

    // Get metadata for each week and for the total
    Object.keys(byWeek).forEach(weekKey => {
        byWeek[weekKey] = { ...byWeek[weekKey], ...getMetadata(byWeek[weekKey]) };
    });

    Object.assign(allTime, getMetadata(allTime));

    return { byWeek, allTime };
}

/**
 * User friendly print the analytics to the user
 * @param {*} analytics
 */
function printAnalytics(file, analytics) {
    const { byWeek, allTime } = analytics;

    const commonParameters = {}; // colWidths: ['1', '1', '1'] };

    // By week
    const byWeekTableOutput = new cliTable({ head: ['Week', ...OUTPUT_ANALYTICS_FIELDS_ORDER], ...commonParameters });

    Object.keys(byWeek)
        .sort()
        .reverse()
        .forEach(weekKey => {
            byWeekTableOutput.push([weekKey, ...analyticsRowToArray(byWeek[weekKey])]);
        });

    // Total
    const allTimeTableOutput = new cliTable({ head: OUTPUT_ANALYTICS_FIELDS_ORDER, ...commonParameters });
    allTimeTableOutput.push(analyticsRowToArray(allTime));

    // Print
    const title = new cliTable({ head: [`Analytics for ${file}`] });
    console.log('');
    console.log(title.toString());
    console.log('');

    console.log('-> Stats by week');
    console.log(byWeekTableOutput.toString());

    console.log('');

    console.log('-> All time stats');
    console.log(allTimeTableOutput.toString());
}

/**
 * Save analytics data to a given file
 * @param {Object} analytics
 * @param {string} filename
 * @returns {Promise}
 */
function saveAnalyticsCsv(analytics, filename) {
    const csvRows = [];

    // Header
    csvRows.push(['Date', ...OUTPUT_ANALYTICS_FIELDS_ORDER]);

    // Data
    Object.keys(analytics.byWeek)
        .sort()
        .reverse()
        .forEach(weekKey => {
            csvRows.push([weekKey, ...analyticsRowToArray(analytics.byWeek[weekKey])]);
        });

    csvRows.push(['All time', ...analyticsRowToArray(analytics.allTime)]);

    const csvOutput = csvRows.map(entries => entries.join(';')).join('\n');

    return new Promise((resolve, reject) => {
        fs.writeFile(filename, csvOutput, (err) => {
            err
                ? reject(err)
                : resolve();
        });

    });
}

module.exports = { getWeeklyAnalytics, printAnalytics, saveAnalyticsCsv };