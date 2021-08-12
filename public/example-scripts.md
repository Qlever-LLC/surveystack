```
export async function process({ submission, control, params }, { value, context }) {
    // for testing --> 
    // -83.8163577206432 42.27720580754399
    // http://landgisapi.opengeohub.org/query/point?lat=7.58033&lon=35.6561&coll=layers1km&regex=clm_precipitation_imerge.(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_m_1km_s0..0cm_.*_v0.1.tif
    let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul','aug','sep','oct','nov','dec'];
    let month = months[new Date().getMonth()];
    const lat = submission.data.location.value.lat;
    const long = submission.data.location.value.lng;
    log(lat);
    log(long);
    const soil = await fetch(`https://landgisapi.opengeohub.org/query/point?lat=${lat}&lon=${long}&coll=predicted250m`);
    const soilJson = await soil.json();
    const weather = await fetch(`https://landgisapi.opengeohub.org/query/point?lat=${lat}&lon=${long}&coll=layers1km`);
    const weatherJson = await weather.json();
    log('soil from Open Land Map', soilJson);
    log('weather from Open Land Map', weatherJson);

    return {
        context: { soilJson, weatherJson, month, lat, long},
        value: null,
        status: { type: statusTypes.SUCCESS, message: `it worked! ${Date.now()}` },
    };
};


export function render(props, { value, context }, setState) {

    const ui = createUI();

    const bulkDensity = [
    context.soilJson.response[0]['sol_bulkdens.fineearth_usda.4a1h_m_250m_b0..0cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_bulkdens.fineearth_usda.4a1h_m_250m_b10..10cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_bulkdens.fineearth_usda.4a1h_m_250m_b30..30cm_1950..2017_v0.2.tif'],
    ];
    
    const carbonEstimate = [
    context.soilJson.response[0]['sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_organic.carbon_usda.6a1c_m_250m_b10..10cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_organic.carbon_usda.6a1c_m_250m_b30..30cm_1950..2017_v0.2.tif'],
    ];

    const textureClass = [
    context.soilJson.response[0]['sol_texture.class_usda.tt_m_250m_b0..0cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_texture.class_usda.tt_m_250m_b10..10cm_1950..2017_v0.2.tif'],
    context.soilJson.response[0]['sol_texture.class_usda.tt_m_250m_b30..30cm_1950..2017_v0.2.tif'],
    ];

    const rainfall = context.weatherJson.response[0]['clm_precipitation_imerge.' + context.month + '_m_1km_s0..0cm_2014..2018_v0.1.tif']
//    log('clm_precipitation_imerge.' + context.month + '_m_1km_s0..0cm_2014..2018_v0.1.tif');
//    log(rainfall);

ui.add(
        ui.card('0cm - ' + bulkDensity[0] + '<br>' + '10cm - ' + bulkDensity[1] + '<br>' + '30cm - ' + bulkDensity[2] + '<br>', { 
            header: 'Bulk Density',
            meta: 'Estimate from OpenLandMap', 
        }),
        ui.card('0cm - ' + carbonEstimate[0] + '<br>' + '10cm - ' + carbonEstimate[1] + '<br>' + '30cm - ' + carbonEstimate[2] + '<br>', { 
            header: 'Total Organic Carbon',
            meta: 'Estimate from OpenLandMap', 
        }),
        ui.card('0cm - ' + textureClass[0] + '<br>' + '10cm - ' + textureClass[1] + '<br>' + '30cm - ' + textureClass[2] + '<br>', { 
            header: 'Texture Class',
            meta: 'Estimate from OpenLandMap', 
        }),
        ui.card(rainfall + ' mm', { 
            header: 'Rainfall',
            meta: 'Estimate from OpenLandMap', 
        })
)
    return ui.node;
};

```
```
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function process({ submission, control, params }, { value, context }) {
    log(params);
    const response = await fetch('https://rest.soilgrids.org/query?lon=0&lat=0');
    const json = await response.json();
    log('something', json);
    const statusCodes = [
        100, 101, 200, 201, 202, 204, 206, 207, 300, 301, 302, 303, 304, 305, 307, 
        400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 412, 413, 414, 415, 
        416, 417, 418, 420, 421, 422, 423, 424, 425, 426, 429, 431, 444, 450, 451, 
        499, 500, 501, 502, 503, 504, 506, 507, 508, 509, 510, 511, 599,
    ];

    return {
        context: { statusCodes, json },
        value: getRandomInt(0, statusCodes.length),
        status: { type: statusTypes.SUCCESS, message: `it worked! ${Date.now()}` },
    };
};


export function render(props, { value, context }, setState) {

    const ui = createUI();
    // const wrapper = document.createElement('div');
    log('context', context);
    log('value', value);
    
    ui.add(ui.text(Date.now()));
    ui.add(ui.markdown(`\`\`\`
${JSON.stringify(context.json, null, 2)}
\`\`\``));
    ui.add(
        ui.card(`<img src="http://http.cat/${context.statusCodes[value]}.jpg"  style="width: 100%" />`)
    );

    ui.add(
        ui.text('Basic text' + value),
        ui.markdown(`# Markdown Headline
-------
*italics*
**bold**
***bold italics***
~~strikethrough~~
[link]()
> Quote
- Unordered List
- List Item

1. Ordered List
2. List Item
        `),

        ui.card('my card content', { 
            header: 'Card', 
            meta: 'meta', 
            footer: 'footer',
        }),
        ui.message('Error', { type: 'error', header: 'Error' }),
        ui.message('Warning', { type: 'warning', header: 'Warning' }),
        ui.message('Normie', { header: 'Normie' }),
        ui.message('Info', { type: 'info', header: 'Info' }),
        ui.message('Success', { type: 'success', header: 'Success' }),
    );


    // return h('ul', {}, h('li', {}, result.madlib));

    return ui.node;
};
```
```
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function process({ submission, control, params }, { value, context }) {
    log(params);
    const statusCodes = [
        100, 101, 200, 201, 202, 204, 206, 207, 300, 301, 302, 303, 304, 305, 307, 
        400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 412, 413, 414, 415, 
        416, 417, 418, 420, 421, 422, 423, 424, 425, 426, 429, 431, 444, 450, 451, 
        499, 500, 501, 502, 503, 504, 506, 507, 508, 509, 510, 511, 599,
    ];

    return {
        context: { statusCodes },
        value: getRandomInt(0, statusCodes.length),
        status: { type: statusTypes.SUCCESS, message: `it worked! ${Date.now()}` },
    };
};


export function render(props, { value, context }, setState) {

    const ui = createUI();
    // const wrapper = document.createElement('div');
    log('context', context);
    log('value', value);
    
    ui.add(ui.text(Date.now()));
    ui.add(
        ui.card(`<img src="http://http.cat/${context.statusCodes[value]}.jpg"  style="width: 100%" />`)
    );

    ui.add(
        ui.text('Basic text' + value),
        ui.markdown(`# Markdown Headline
-------
*italics*
**bold**
***bold italics***
~~strikethrough~~
[link]()
> Quote
- Unordered List
- List Item

1. Ordered List
2. List Item
        `),

        ui.card('my card content', { 
            header: 'Card', 
            meta: 'meta', 
            footer: 'footer',
        }),
        ui.message('Error', { type: 'error', header: 'Error' }),
        ui.message('Warning', { type: 'warning', header: 'Warning' }),
        ui.message('Normie', { header: 'Normie' }),
        ui.message('Info', { type: 'info', header: 'Info' }),
        ui.message('Success', { type: 'success', header: 'Success' }),
    );


    // return h('ul', {}, h('li', {}, result.madlib));

    return ui.node;
};
```
```
export function process({ submission, control, params }, { value, context }) {
    // log(control.options.params);

    return {
        context,
        value,
        status: { type: statusTypes.SUCCESS, message: `it worked! ${Date.now()}` },
    };
};


export function render(props, { value, context }, setState) {

    const ui = createUI();
    // const wrapper = document.createElement('div');

    ui.add(
        ui.text('Basic text'),
        ui.markdown(`# Markdown Headline
-------
*italics*
**bold**
***bold italics***
~~strikethrough~~
[link]()
> Quote
- Unordered List
- List Item

1. Ordered List
2. List Item
        `),

        ui.card('my card content', { 
            header: 'Card', 
            meta: 'meta', 
            footer: 'footer',
        }),
        ui.message('Error', { type: 'error', header: 'Error' }),
        ui.message('Warning', { type: 'warning', header: 'Warning' }),
        ui.message('Normie', { header: 'Normie' }),
        ui.message('Normie'),
        ui.message('Info', { type: 'info', header: 'Info' }),
        ui.message('Success', { type: 'success', header: 'Success' }),
    );


    // return h('ul', {}, h('li', {}, result.madlib));

    return ui.node;
};
```