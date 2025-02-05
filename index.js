const fs = require('fs')
const csv = require('csv-parser')
const dateFns = require('date-fns');
const cliTable = require('cli-table');

const { analyticsFields } = require('./constants');
const { getAnalytics, saveAnalyticsCsv } = require('./analytics');
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

    const commonParameters = {}; // colWidths: ['1', '1', '1'] };

    /**
     * Ensure data is in order before being sent to the table
     * @param {object} analytics
     * @returns 
    */
    function analyticsAsArray(analytics) {
        return analyticsFields
            .map(key => analytics[key]);
    }

    // By week
    const byWeekTableOutput = new cliTable({ head: ['Week', ...analyticsFields], ...commonParameters });

    Object.keys(byWeek)
        .sort()
        .reverse()
        .forEach(weekKey => {
            byWeekTableOutput.push([weekKey, ...analyticsAsArray(byWeek[weekKey])]);
        });

    // Total
    const totalTableOutput = new cliTable({ head: analyticsFields, ...commonParameters });
    totalTableOutput.push(analyticsAsArray(totalAnalytics));

    // Print
    console.log('-> Stats by week');
    console.log(byWeekTableOutput.toString());

    console.log('');

    console.log('-> Total stats');
    console.log(totalTableOutput.toString());
}

const args = getArgs();

function hasArg(argName) {
    return argName in args;
}

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
    .then(analytics => {
        if (hasArg('--save-csv')) {
            const datestamp = dateFns.format(new Date(), 'yyyy-mm-dd--HH-mm');
            const csvOutputFilename = `${file} analytics - ${datestamp}.csv`;

            console.log('Saving analytics as CSV under', csvOutputFilename);
            saveAnalyticsCsv(analytics, csvOutputFilename);
        }

        return analytics;
    })
    .then(outputAnalytics);

// @todo
// Filtering rows on date
// Timezone stuff
