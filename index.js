const countries = require('./lib/countries.json');
const { getAppInput, getHomeCountry, getHomeCurrency, confirmDetails, selectPurchase } = require('./lib/prompts.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chalk = require('chalk');
const pricing = [];

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

async function checkCountry(appId, code, selectedPurchase) {
    try {
        const data = await checkApplication(appId, code);
        
        const purchases = data.relationships['top-in-apps'].data;
        let finishCheck = false;

        for (const purchase of purchases) {
            if(purchase.attributes.offerName === selectedPurchase.attributes.offerName) {
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

(async () => {
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

    console.clear();
    console.log(chalk.yellow("Starting worldwide pricing check for the selected purchase based on your local currency...\n"));
    await sleep(2000);

    // check if the purchase is available in each country
    for (const country of countries) {
        await checkCountry(appId, country.code, purchase);
    };

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
            console.log(chalk.yellow(`-------------- ${purchase.attributes.name} --------------\n`));
            
            for (const item of pricing) {
                console.log(`${item.country}: ${item.price} ${item.currency} → ` + chalk.green(`${item[`price${homeCurrency.toUpperCase()}`]} ${homeCurrency.toUpperCase()}`));
            }
        }
    }
})();