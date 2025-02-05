const dateFns = require('date-fns');

function getPercentage(count, total) {
    return `${Math.round((count / total) * 100)} %`;
}


function getWeekKey(date) {
    const rowContacYear = dateFns.format(date, 'yyyy')
    const rowContacWeek = dateFns.format(date, 'ww')
    return `${rowContacYear}-W${rowContacWeek}`;
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

function adjustDate(date) {
    return dateFns.add(date, { hours: 1 }); // Compensate current timezone offset
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

module.exports = {
    getPercentage,
    getWeekKey,
    reformatDateFields,
    formatDateField,
};