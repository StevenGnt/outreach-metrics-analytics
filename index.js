const csv = require('csv-parser')
const fs = require('fs')
const dateFns = require('date-fns');
const cliTable = require('cli-table');

/**
 * Return CLI args
 * @returns {object}
 */
function getArgs() {
    return process.argv.slice(2).reduce((params, nextArg) => ({ ...params, [nextArg.split("=")[0]]: nextArg.split("=")[1] }), {});
}

/**
 * Get the rows of an outreach metrics file, matched against a set of filters
 * @param {string} csvFilename
 * @param {object} filters
 * @returns {array}
*/
function getCsvData(csvFilename) {
    return new Promise(resolve => {
        const results = [];
        const csvParserOptions = {};

        fs.createReadStream(csvFilename)
            .pipe(csv(csvParserOptions))
            .on('data', row => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            });

    });
}

/**
 * Reformat date fields to an easily manipulated format
 * @param {object} row 
 * @returns {object}
 */
function reformatDateFields(row) {
    // List of fields to reformat
    const dateFieldsToReformat = [
        'First Contacted',
        'Prospect First Reply',
        'Follow Up Date',
    ];

    return dateFieldsToReformat
        .reduce(
            (acc, currentFieldName) => ({
                ...acc,
                [currentFieldName]: row[currentFieldName]
                    ? formatDateField(row[currentFieldName])
                    : row[currentFieldName]
            }),
            {}
        );
}

/**
 * Format a date field into a more usable format
 * @param {*} value 
 * @returns 
 */
function formatDateField(value) {
    // Month are displayed with their french names
    const translatedMonths = {
        'janvier': '01',
        'février': '02',
        'mars': '03',
        'avril': '04',
        'mai': '05',
        'juin': '06',
        'juillet': '07',
        'août': '08',
        'septembre': '09',
        'octobre': '10',
        'novembre': '11',
        'décembre': '12',
    }

    const [day, frenchMonth, year] = value.split(' ');

    const parsed = dateFns.parse(`${year}-${translatedMonths[frenchMonth]}-${day}`, 'yyyy-MM-dd', new Date());

    return adjustDate(parsed);
}

function adjustDate(date) {
    return dateFns.add(date, { hours: 1 }); // Compensate current timezone offset
}

/**
 * Format the loaded results
 * @param {array} rows
 * @returns {array}
 */
function formatResults(rows) {
    return rows.map(row => ({
        ...row,
        ...reformatDateFields(row),

    }))
}

function filterResults(rows, filters) {
    return rows.filter(row => {
        // Empty row
        // if (!row.Artist) {
        //     return false;
        // }

        // @todo Use filters

        return true;
    });
}

function getWeekKey(date) {
    const rowContacYear = dateFns.format(date, 'yyyy')
    const rowContacWeek = dateFns.format(date, 'ww')
    return `${rowContacYear}-W${rowContacWeek}`;
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

        if (row['CCasual Call Attended']) {
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

function getPercentage(count, total) {
    const percentage = total != 0
        ? Math.round((count / total) * 100)
        : 0;

    return `${percentage} %`;
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
        responseRate: getPercentage(firstContactsReplies, firstContacts),
        attendanceRate: getPercentage(casualCallsBooked, casualCallsAttended)
    };
}

/**
 * User friendly print the analytics to the user
 * @param {*} analytics 
 */
function outputAnalytics(analytics) {
    const { byWeek, totalAnalytics } = analytics;

    // Map between analytic property > table header name
    const analyticsDisplayedProperties = {
        'firstContacts': 'First contacts',
        'firstContactsReplies': 'Replies',
        'responseRate': 'Response rate',
        'casualCallsBooked': 'Casual calls booked',
        'casualCallsAttended': 'Attended',
        'attendanceRate': 'Attendance rate',
    };

    const commonTableHeaders = Object.values(analyticsDisplayedProperties);
    const commonParameters = {}; // colWidths: ['1', '1', '1'] };

    /**
     * @param {object} analytics
     * @returns 
    */
    function analyticsAsArray(analytics) {
        return Object.keys(analyticsDisplayedProperties)
            .map(key => analytics[key]);
    }

    // By week
    const byWeekTableOutput = new cliTable({ head: ['Week', ...commonTableHeaders], ...commonParameters });

    Object.keys(byWeek)
        .sort()
        .reverse()
        .forEach(weekKey => {
            byWeekTableOutput.push([weekKey, ...analyticsAsArray(byWeek[weekKey])]);
        });

    // Total
    const totalTableOutput = new cliTable({ head: commonTableHeaders, ...commonParameters });
    totalTableOutput.push(analyticsAsArray(totalAnalytics));

    // Print
    console.log('-> Stats by week');
    console.log(byWeekTableOutput.toString());

    console.log('');

    console.log('-> Total stats');
    console.log(totalTableOutput.toString());
}

const args = getArgs();
const { file, startDate, endDate } = args;
const filters = { startDate, endDate };

// Temporary warning
const warning = new cliTable({ head: ["Don't forget to save the metrics file with UTF-8 WITHOUT BOM !"]});
console.log('');
console.log(warning.toString());
console.log('');

getCsvData(file)
    .then(formatResults)
    .then(results => filterResults(results, filters))
    .then(getAnalytics)
    .then(outputAnalytics);

// @todo
// Not having to re save as UTF8 without BOM
// Filtering rows on date
// Analytics
// Timezone stuff
