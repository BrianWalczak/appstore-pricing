<h1 align="center">appstore-pricing | App Store IAP Comparison</h1>

<p align="center">A CLI utility to search and compare localized pricing for in-app purchases across all App Store regions in your own currency.<br><br> <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"></a></p>

## Features
- (🔍) Search any App Store app by link or ID seamlessly
- (🌍) Check availability and pricing for in-app purchases across all countries/regions
- (💱) Convert prices to your local currency effortlessly using real-time exchange rates
- (📊) Discover how much more or less you're paying compared to other regions
- (📁) Export results as JSON for easy sharing, analysis, or integration with an existing project.

## Setup
To use `appstore-pricing`, make sure Node.js is properly installed on your computer (run `node --version` to check if it exists). If you don't have it installed yet, you can download it [here](https://nodejs.org/en/download).

Then, clone the repository and install the dependencies:

```bash
$ git clone https://github.com/BrianWalczak/appstore-pricing.git; # Clone the repository from GitHub
$ cd appstore-pricing # Enter the extracted repository folder
$ npm install # Install libraries and dependencies
```

To run the CLI, simply use the following command and follow the prompts:
```bash
$ node index.js
? Please enter an Apple App Store link or App ID to search for: ▍
```

## Results
After configuring the program, `appstore-pricing` will fetch and convert the in-app purchase pricing for every country using real-time exchange rates.

### Example Output
```bash
United Kingdom: 9.99 GBP → 13.54 USD
India: 379.00 INR → 4.41 USD
Brazil: 279.90 BRL → 49.70 USD
Egypt: 209.99 EGP → 4.23 USD
Japan: 1200.00 JPY → 8.41 USD
...
```

### Example Export
```bash
[
  {
    "country": "United Kingdom",
    "price": 9.99,
    "currency": "GBP",
    "priceUSD": 13.54
  },
  {
    "country": "India",
    "price": 379,
    "currency": "INR",
    "priceUSD": 4.41
  },
  {
    "country": "Brazil",
    "price": 279.9,
    "currency": "BRL",
    "priceUSD": 49.7
  },
  {
    "country": "Egypt",
    "price": 209.99,
    "currency": "EGP",
    "priceUSD": 4.23
  },
  {
    "country": "Japan",
    "price": 1200,
    "currency": "JPY",
    "priceUSD": 8.41
  },
...
```

## Contributions
If you'd like to contribute to this project, please create a pull request [here](https://github.com/BrianWalczak/appstore-pricing/pulls). You can submit your feedback or any bugs that you find, on our <a href='https://github.com/BrianWalczak/appstore-pricing/issues'>issues page</a>. Contributions are highly appreciated and will help us keep this project up-to-date!

If you'd like to support this project and its development, you can send me a donation <a href='https://ko-fi.com/brianwalczak'>here</a> :)

<br>
  <p align="center">Made with ♡ by <a href="https://www.brianwalczak.com">Briann</a></p>
