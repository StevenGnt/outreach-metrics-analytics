const csv = require('csv-parser')
const fs = require('fs')
const cliTable = require('cli-table');

const { getAnalytics } = require('./analytics');
const { reformatDateFields } = require('./utils');

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

// Title
const title = new cliTable({ head: [`Analytics for ${file}`] });
console.log('');
console.log(title.toString());
console.log('');

// Temporary warning
// const warning = new cliTable({ head: ["Don't forget to save the metrics file with UTF-8 WITHOUT BOM !"]});
// console.log('');
// console.log(warning.toString());
// console.log('');

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
