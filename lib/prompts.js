const inquirer = require('inquirer'); // v8 required
const countries = require('./countries.json');

async function getAppInput() {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: 'Please enter an Apple App Store link or App ID to search for:',
      validate(value) {
        if (/apps\.apple\.com\/.*id\d+/.test(value) || /^id\d+$/.test(value) || /^\d+$/.test(value)) {
          return true;
        } else {
            return 'Please enter a valid App Store URL or App ID.';
        }
      }
    }
  ]);

  let appId = input;

  const match = appId.match(/id?(\d+)/);
  if(match) appId = match[1];

  return appId;
}

async function getHomeCountry() {
  const { country } = await inquirer.prompt([
    {
      type: 'list',
      name: 'country',
      message: 'Please select your home country:',
      choices: countries.map(country => ({
        name: `${country.name} (${country.code})`,
        value: country.code
      })),
      validate(value) {
        if (countries.some(country => country.code.toUpperCase() === value.toUpperCase())) {
          return true;
        } else {
          return 'Please select a valid country.';
        }
      }
    }
  ]);

  return country.toUpperCase();
}

async function getHomeCurrency() {
  const { currency } = await inquirer.prompt([
    {
      type: 'input',
      name: 'currency',
      message: 'Please enter your home currency (e.g., USD, EUR):',
      validate(value) {
        if (/^[a-zA-Z]{3}$/.test(value)) {
          return true;
        } else {
          return 'Please enter a valid 3-letter currency code.';
        }
      }
    }
  ]);

  return currency.toUpperCase();
}

async function confirmDetails(prompt = 'Are the following details correct?') {
    const { confirm } = await require('inquirer').prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: prompt,
            default: true
        }
    ]);

    return confirm;
}

async function selectPurchase(purchases) {
    const choices = purchases.map((purchase, index) => ({
        name: `${purchase.attributes.name}: ${purchase.attributes.offers[0].priceFormatted} (${purchase.attributes.offers[0].currencyCode})`,
        value: purchase,
    }));

    const { selectedPurchase } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedPurchase',
            message: 'Please select an in-app purchase to search for:',
            choices,
        }
    ]);

    return selectedPurchase;
}

async function getSearchKeywords() {
  const { keywords } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keywords',
      message: 'Please enter keywords (or phrases) to search for, such as subscription names, separated by commas:',
      validate(value) {
        if (value.trim() === '') {
          return 'Keywords cannot be empty. Please enter at least one keyword or phrase.';
        }
        const keywordArray = value.split(',').map(keyword => keyword.trim());
        if (keywordArray.some(keyword => keyword === '')) {
          return 'Please ensure all keywords (or phrases) are valid and separated by commas.';
        }
        return true;
      }
    }
  ]);

  return [...new Set(keywords.split(',').map(keyword => keyword.trim()))];
}

module.exports = {
  getAppInput,
  getHomeCountry,
  getHomeCurrency,
  confirmDetails,
  selectPurchase,
  getSearchKeywords
};