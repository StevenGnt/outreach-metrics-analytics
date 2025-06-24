const ANALYTICS_FIELDS = [
    'First Contacted',
    'Prospect First Reply',
    'Good conversation',
    'Casual Call Booked',
    'Casual Call Attended',
    'Proof Session Booked',
    'Proof Session Attended',
    'Sales Call Booked',
    'Sales Call Attended',
    'Sale Closed',
    'Response %',
    'Good conversation %',
    'CC booking %',
    'CC attendance %',
    'PS booking %',
    'PS attendance %',
    'SC booking %',
    'SC attendance %',
    'SC close %',
];

const ANALYTICS_COLLECTED_FIELDS = {
    FIRST_CONTACTED: 'First contacted',
    FIRST_REPLY: 'Replies',
    GOOD_CONVERSATION: 'Good conversation',
    // CC_ASKED: 'CC asked',
    CC_BOOKED: 'CC booked',
    CC_ATTENDED: 'CC attended',
    PS_BOOKED: 'PS booked',
    PS_ATTENDED: 'PS attended',
    SC_BOOKED: 'SC booked',
    SC_ATTENDED: 'SC attended',
    SALE_CLOSED: 'Sale closed',
};

const ANALYTICS_METADATA_FIELDS = {
    RESPONSE_RATE: 'Response %',
    GOOD_CONVERSATION_RATE: 'Good conversation %',
    CC_BOOKING_RATE: 'CC booking %',
    CC_ATTENDANCE_RATE: 'CC attendance %',
    PS_BOOKING_RATE: 'PS booking %',
    PS_ATTENDANCE_RATE: 'PS attendance %',
    SC_BOOKING_RATE: 'SC booking %',
    SC_ATTENDANCE_RATE: 'SC attendance %',
    SALE_CLOSE_RATE: 'Sale close %',
};

const NOTION_ANALYTICS_FIELDS_MAP = [
    {
        notionFieldName: 'First Contacted',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.FIRST_CONTACTED,
    },
    {
        notionFieldName: 'Prospect First Reply',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.FIRST_REPLY,
    },
    {
        notionFieldName: 'Casual Call Booked',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.CC_BOOKED,
    },
    {
        notionFieldName: 'Casual Call Attended',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.CC_ATTENDED,
    },
    {
        notionFieldName: 'Proof Session Booked',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.PS_BOOKED,
    },
    {
        notionFieldName: 'Proof Session Attended',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.PS_ATTENDED,
    },
    {
        notionFieldName: 'Sales Call Booked',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.SC_BOOKED,
    },
    {
        notionFieldName: 'Sales Call Attended',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.SC_ATTENDED,
    },
    {
        notionFieldName: 'Sale Closed',
        analyticsCountField: ANALYTICS_COLLECTED_FIELDS.SALE_CLOSED,
    },
    {
    }
];

const OUTPUT_ANALYTICS_FIELDS_ORDER = [
    ANALYTICS_COLLECTED_FIELDS.FIRST_CONTACTED,
    ANALYTICS_COLLECTED_FIELDS.FIRST_REPLY,
    ANALYTICS_COLLECTED_FIELDS.GOOD_CONVERSATION,
    ANALYTICS_METADATA_FIELDS.RESPONSE_RATE,
    ANALYTICS_METADATA_FIELDS.GOOD_CONVERSATION_RATE,
    // ANALYTICS_COLLECTED_FIELDS.CC_ASKED,
    ANALYTICS_COLLECTED_FIELDS.CC_BOOKED,
    ANALYTICS_METADATA_FIELDS.CC_BOOKING_RATE,
    ANALYTICS_COLLECTED_FIELDS.CC_ATTENDED,
    ANALYTICS_METADATA_FIELDS.CC_ATTENDANCE_RATE,
    ANALYTICS_COLLECTED_FIELDS.PS_BOOKED,
    ANALYTICS_METADATA_FIELDS.PS_BOOKING_RATE,
    ANALYTICS_COLLECTED_FIELDS.PS_ATTENDED,
    ANALYTICS_METADATA_FIELDS.PS_ATTENDANCE_RATE,
    ANALYTICS_COLLECTED_FIELDS.SC_BOOKED,
    ANALYTICS_METADATA_FIELDS.SC_BOOKING_RATE,
    ANALYTICS_COLLECTED_FIELDS.SC_ATTENDED,
    ANALYTICS_METADATA_FIELDS.SC_ATTENDANCE_RATE,
    ANALYTICS_COLLECTED_FIELDS.SALE_CLOSED,
    ANALYTICS_METADATA_FIELDS.SALE_CLOSE_RATE,
];

const NOTION_TAGS = {
    GOOD_CONVERSATION: 'Good conversation',
    DEAD_LEAD: 'Dead lead',
};

module.exports = {
    NOTION_ANALYTICS_FIELDS_MAP,
    NOTION_TAGS,
    ANALYTICS_COLLECTED_FIELDS,
    ANALYTICS_FIELDS,
    ANALYTICS_METADATA_FIELDS,
    OUTPUT_ANALYTICS_FIELDS_ORDER,
};