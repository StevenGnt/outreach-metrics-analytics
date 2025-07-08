#!/usr/bin/env node

const path = require('path');
const argsParser = require('args-parser');
const { format, parse, compareAsc } = require('date-fns');

const { getWeeklyAnalytics, saveAnalyticsCsv, printAnalytics } = require('./analytics');
const loaderCsv = require('./loader-csv');
const loaderNotion = require('./loader-notion');
const { adjustDate } = require('./utils');

/**
 * Parse a CLI date parameter
 * @param {string} paramDate 
 */
function parseParamDate(paramDate) {
    const [year, month, day] = paramDate.split('-');
    const parsed = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date());
    return adjustDate(parsed);
}

function filterResults(rows, { startDate, endDate }) {
    const truthyTest = () => true;

    let testStartDate = truthyTest;
    let testEndDate = truthyTest;

    if (startDate) {
        const parsedStartDate = parseParamDate(startDate);
        testStartDate = rowFirstContacted => {
            const result = compareAsc(rowFirstContacted, parsedStartDate);
            return result === 1 || result === 0;
        };
    }

    if (endDate) {
        const parsedEndDate = parseParamDate(endDate);

        testEndDate = rowFirstContacted => {
            const result = compareAsc(rowFirstContacted, parsedEndDate);
            return result === -1 || result === 0;
        };
    }

    return rows.filter(row => {
        if (!row['First Contacted']) {
            return false;
        }

        const rowFirstContacted = row['First Contacted'];

        return testStartDate(rowFirstContacted) && testEndDate(rowFirstContacted);
    });
}

(async function run() {
    const cmdArgs = argsParser(process.argv);

    const {
        file,
        'notion-db-id': notionDbId,
        'start-date': startDate,
        'end-date': endDate,
        'save-csv': saveCsv,
        output,
    } = cmdArgs;

    // Get data from the appropriate channel
    let results;
    if (file) {
        results = await loaderCsv(file);
    } else if (notionDbId) {
        results = await loaderNotion(notionDbId);
    } else {
        throw new Error('Provide one of "file" or "notion-url" parameters');
    }

    results = filterResults(results, { startDate, endDate });

    const analytics = getWeeklyAnalytics(results);

    if (saveCsv) {
        const datestamp = format(new Date(), 'yyyy-MM-dd--HH-mm-ss');
        const outputDir = output || process.cwd();

        const outputBaseFilename = file
            ? path.basename(file)
            : notionDbId;

        const csvOutputFilename = path.join(outputDir, `${outputBaseFilename} analytics - ${datestamp}.csv`);

        console.log('Saving analytics as CSV under', csvOutputFilename);
        saveAnalyticsCsv(analytics, csvOutputFilename);
    }

    printAnalytics(file, analytics);
})();

// @todo
// Timezone stuff
