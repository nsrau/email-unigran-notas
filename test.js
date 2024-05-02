const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
(async () => {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
        headless: !isProduction,
        executablePath,
        args: chromium.args
    });
    const page = await browser.newPage();

    await page.goto('https://www.google.com/')
    page.on('dialog', async dialog => {
        console.log(dialog.message())
        await dialog.dismiss()
    })
    await page.evaluate(() => alert('This message is inside an alert box'))
    await browser.close()
})();