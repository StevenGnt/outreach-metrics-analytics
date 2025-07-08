const { Client: NotionClient } = require('@notionhq/client');

const config = require('./config.json');

async function getAllRows(notionDbId) {
    const { NOTION_API_KEY } = config;

    let hasMore = true;
    let startCursor = undefined;
    let fetchRounds = 0;
    const results = [];

    const notion = new NotionClient({ auth: NOTION_API_KEY });

    while (hasMore) {
        console.info('⌛', `Sending Notion API, query n°${++fetchRounds}...`);
        const response = await notion.databases.query({
            database_id: notionDbId,
            start_cursor: startCursor,
        });

        results.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    return results;
}

/**
 * Flatten Notion rows
 * @param {array} rows 
 * @returns 
 */
function prepareNotionRows(rows) {
    return rows.map(
        row => Object.keys(row.properties)
            .reduce(
                (preparedRow, currentPropertyKey) => {
                    const property = row.properties[currentPropertyKey];

                    let finalValue;

                    switch (property.type) {
                        case 'title':
                            finalValue = property.title[0].text.content;
                            break;

                        case 'date':
                            finalValue = property.date?.start;
                            break;

                        case 'multi_select':
                            finalValue = property.multi_select.map(value => value.name).join(',');
                            break;

                        case 'status':
                            finalValue = property.status?.name;
                            break;

                        case 'url':
                            finalValue = property.url;
                            break;

                        default:
                            finalValue = `** Data type not handled - ${property.type} **`;
                            break;
                    }

                    return { ...preparedRow, [currentPropertyKey]: finalValue || '' };
                },
                {}
            ),
    );
}

async function loaderNotion(notionDbId) {
    console.info('🟢', 'Starting Notion fetch');
    let databaseRows = await getAllRows(notionDbId);
    console.info('🟢', databaseRows.length, 'rows fetched');

    console.info('⌛', 'Preparing rows for processing...');
    databaseRows = prepareNotionRows(databaseRows);
    console.info('🟢', 'Done');

    return databaseRows;
}

module.exports = loaderNotion;
