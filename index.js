const countries = require('./lib/countries.json');
const { getAppInput, getHomeCountry, getHomeCurrency, confirmDetails, selectPurchase, getSearchKeywords } = require('./lib/prompts.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chalk = require('chalk');
let pricing = [];

function getCountryByCode(code) {
    const country = countries.find(country => country.code.toLowerCase() === code.toLowerCase());
    return country ? country.name : null;
}

async function getConversionRate(currency = 'USD') {
    const req = await fetch(`https://open.er-api.com/v6/latest/${currency.toUpperCase()}`);
    const res = await req.json();
    return res?.rates;
}

async function checkApplication(appId, code) {
    const req = await fetch(`https://apps.apple.com/${code.toLowerCase()}/app/id${appId}`);
    const res = await req.text();

    const match = res.match(/<script[^>]*id="shoebox-media-api-cache-apps"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
        return null;
    }

    try {
        const rawJson = match[1].trim();
        const outer = JSON.parse(rawJson);
        const inner = JSON.parse(Object.values(outer)[0]);
        
        return inner?.d[0];
    } catch (error) {
        return null;
    }
}

async function checkCountry(appId, code, method, data) {
    try {
        const appData = await checkApplication(appId, code);
        const purchases = appData.relationships['top-in-apps'].data;
        let finishCheck = false;

        for (const purchase of purchases) {
            if((method === 'PURCHASE' && purchase.attributes.offerName === data.attributes.offerName) || (method === 'KEYWORD' && data.some(item => purchase.attributes.name.toLowerCase().includes(item.toLowerCase()))) && !finishCheck) {
                finishCheck = true;
                console.log(`${getCountryByCode(code)} → ` + chalk.green(`${purchase.attributes.offers[0].priceFormatted} (${purchase.attributes.offers[0].currencyCode})`));

                pricing.push({
                    country: getCountryByCode(code),
                    price: purchase.attributes.offers[0].price,
                    currency: purchase.attributes.offers[0].currencyCode
                });
            }
        }

        if(!finishCheck) console.error(getCountryByCode(code) + ' → ' + chalk.red('Purchase not offered in this country.'));
    } catch (error) {
        return console.error(getCountryByCode(code) + ' → ' + chalk.red('Purchase not offered in this country.'));
    }
}

async function checkConversion(conversion, homeCurrency) {
    const valTitle = `price${homeCurrency.toUpperCase()}`;

    for (const item of pricing) {
        if (conversion[item.currency]) {
            item[valTitle] = Number((item.price / conversion[item.currency]).toFixed(2));
        } else {
            item[valTitle] = null;
        }
    }

    pricing.sort((a, b) => {
        if (a[valTitle] === null) return 1;
        if (b[valTitle] === null) return -1;
        return a[valTitle] - b[valTitle];
    });

    return true;
}


async function runCheck(appId, homeCountry, method, data) {
    console.clear();
    console.log(chalk.yellow(`Starting worldwide pricing check for the selected ${method === "PURCHASE" ? "purchase" : method === "KEYWORD" ? "keywords" : ""} based on your local currency...\n`));
    await sleep(2000);

    pricing = []; // reset pricing data

    // check if the purchase is available in each country
    for (const country of countries) {
        if(country.code.toLowerCase() !== homeCountry.toLowerCase()) {
            await checkCountry(appId, country.code, method, data);
        }
    };

    if(pricing.length === 0 && method === "PURCHASE") {
        console.error(
            chalk.yellow("\nHmm, looks like no countries were found with the selected purchase. This could happen for a couple of reasons:\n") +
            `• The app is currently only available in ${getCountryByCode(homeCountry)}.\n` +
            "• The app doesn't offer this in-app purchase for other countries.\n" + 
            "• The app developer could use multiple variants of the app across different regions.\n" +
            "• Most likely, the app developer has separate in-app purchases for different regions, and the one you selected is not available in other countries."
        );

        const attempt = await confirmDetails(`Would you like to try again by searching for in-app purchase keywords (${chalk.cyan('EXPERIMENTAL')})?`);
        if(!attempt) return process.exit(1);

        const keywords = await getSearchKeywords();
        console.log(chalk.blue('Searching for keywords:'), keywords.join(', '));
        await sleep(1000);

        return runCheck(appId, homeCountry, 'KEYWORD', keywords);
    } else if(pricing.length === 0 && method === "KEYWORD") {
        console.error(chalk.yellow("\nUnfortunately, no countries were found with the selected keywords. Please ensure you entered valid keywords and try again."));
        return process.exit(1);
    } else {
        console.log(chalk.green(`\n\nAll countries have been checked (with ${pricing.length} successful checks).`));
        const homeCurrency = await getHomeCurrency();
        const conversion = await getConversionRate(homeCurrency);

        console.clear();
        if(!conversion) {
            console.error(chalk.red("An error occured when retrieving the latest conversion rates. Please ensure you provided a valid currency code."));
            require('fs').writeFileSync('./pricing.json', JSON.stringify(pricing, null, 2));

            console.log(chalk.yellow('Pricing data saved to pricing.json without conversion rates.'));
            return process.exit(1);
        } else {
            await checkConversion(conversion, homeCurrency);

            require('fs').writeFileSync('./pricing.json', JSON.stringify(pricing, null, 2));
            console.log(chalk.green('Conversion rates have been applied. Updated pricing data has been saved to pricing.json!'));

            if(await confirmDetails('Would you like to preview the pricing data?')) {
                console.clear();
                console.log(chalk.yellow(`-------------- ${method === "PURCHASE" ? data.attributes.name : method === "KEYWORD" ? data.join(', ') : ''} --------------\n`));

                for (const item of pricing) {
                    console.log(`${item.country}: ${item.price} ${item.currency} → ` + chalk.green(`${item[`price${homeCurrency.toUpperCase()}`]} ${homeCurrency.toUpperCase()}`));
                }
            }
        }
    }
}

async function interactiveRun() {
    const appId = await getAppInput();
    const homeCountry = await getHomeCountry();

    console.log();
    if(!await confirmDetails()) {
        console.clear();
        return interactiveRun();
    }

    const data = await checkApplication(appId, homeCountry);
    if(!data || !data?.relationships?.['top-in-apps']?.data || data.relationships['top-in-apps'].data.length === 0) {
        console.error(chalk.red("It looks like the app you entered doesn't offer any in-app purchases or is not available in your country."));
        return process.exit(1);
    }

    const purchases = data.relationships['top-in-apps'].data;
    const purchase = await selectPurchase(purchases);

    return runCheck(appId, homeCountry, 'PURCHASE', purchase);
};

console.clear();
console.log(chalk.bold.cyan("appstore-pricing | App Store IAP Comparison"));
console.log("A CLI utility to search and compare localized pricing for in-app purchases\nacross all App Store regions in your own currency.\n");

console.log(chalk.gray("Made with") + chalk.red(" ♡ ") + chalk.gray("by Briann — https://github.com/BrianWalczak"));


interactiveRun();