const fs = require('fs')
const csv = require('csv-parser')

const { reformatDateFields } = require('./utils');

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

async function loaderCsv(file) {
    console.info('⌛', `Loading data from CSV file: ${file}...`);
    let results = await getCsvData(file);
    console.info('🟢', 'Done');

    console.info('⌛', 'Preparing rows for processing...');
    results = formatResults(results);
    console.info('🟢', 'Done');

    return results;
}

module.exports = loaderCsv;
