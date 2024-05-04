const { launch } = require('puppeteer-core');
const chromium = require('@sparticuz/chromium')
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const fs = require('fs');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const unigranLogin = {
    user: process.env.UNIGRAN_USERNAME,
    pass: process.env.UNIGRAN_PASSWORD
}

const debug = process.env.DEBUG === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const url = process.env.UNIGRAN_URL;
const screenshotPath = 'screenshot.png';
const usernameSelector = '#login';
const passwordSelector = '#senha';
const loginButtonSelector = 'button.entrar';
const username = unigranLogin.user;
const password = unigranLogin.pass;

const nextButtonSelector = 'button.btn-primary';
const notasLinkSelector = 'section.content a[href="?pgn=notas"]';
const firstTable = 'table:nth-of-type(1)';

/**
 * Task to run the monitoring of the "Notas" table.
 * It logs into a website, waits for a button to be visible, clicks on it,
 * waits for the "Notas" link to be visible, clicks on it, waits for the table
 * to be visible and takes a screenshot of it. If there are any changes
 * detected compared to the previous screenshot, it sends an email with
 * the new screenshot.
 */
async function runTask() {
    try {
        const executablePath = await chromium.executablePath();

        // Launches a headless browser
        const browser = await launch({
            headless: debug && !isProduction,
            executablePath,
            args: chromium.args
        });

        // Opens a new page
        console.log('Opening new page');
        const page = await browser.newPage();

        // Sets the viewport
        console.log('Set viewport to 1100x900');
        await page.setViewport({ width: 1100, height: 900 });

        // Goes to the website
        console.log('Navigated to ' + url);
        await page.goto(url);

        // Logs into the website
        console.log('Logged in');
        await performLogin(page);

        // Clicks on the button and waits for the next page
        console.log('Clicked on next button');
        await clickAndWait(page, nextButtonSelector);

        // Clicks on the "Notas" link and waits for the table
        console.log('Clicked on "Notas" link');
        await clickAndWait(page, notasLinkSelector);

        // Takes a screenshot and checks for changes
        console.log('Taking screenshot and checking for changes');
        await takeAndCheckScreenshot(page, firstTable);

        // Closes the browser
        console.log('Closing browser');
        await browser.close();
    } catch (error) {
        throw error;
    }
}

/**
 * Logs into the website.
 * @param {import('puppeteer-core').Page} page - The page object.
 */
async function performLogin(page) {
    // Logs in
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    await page.click(loginButtonSelector);
    await page.waitForNavigation();
}

/**
 * Clicks on a selector and waits for the next page.
 * @param {import('puppeteer-core').Page} page - The page object.
 * @param {string} selector - The selector to click on.
 */
async function clickAndWait(page, selector) {
    // Waits for the selector to be visible and clicks on it
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    //await page.waitForNavigation();
}

/**
 * Takes a screenshot and checks for changes.
 * @param {import('puppeteer-core').Page} page - The page object.
 * @param {string} tableSelector - The selector of the table.
 */
async function takeAndCheckScreenshot(page, tableSelector) {
    // Waits for the table to be visible and takes a screenshot
    await page.waitForSelector(tableSelector, { visible: true });
    const table = await page.$(tableSelector);
    const newScreenshotBuffer = await table.screenshot();

    // Checks for changes compared to the previous screenshot
    await compareScreenshots(newScreenshotBuffer);
}

/**
 * Compares two screenshots.
 * @param {Buffer} newScreenshotBuffer - The buffer of the new screenshot.
 */
async function compareScreenshots(newScreenshotBuffer) {
    if (fs.existsSync(screenshotPath)) {
        const previousScreenshot = PNG.sync.read(fs.readFileSync(screenshotPath));
        const newScreenshot = PNG.sync.read(newScreenshotBuffer);
        const { width, height } = previousScreenshot;
        const diff = new PNG({ width, height });

        const numDiffPixels = pixelmatch(
            previousScreenshot.data, newScreenshot.data, diff.data, width, height,
            { threshold: 0.1 }
        );

        if (numDiffPixels > 0) {
            console.log('Mudança detectada na tabela de notas');

            // Sends an email with the new screenshot
            await sendEmail(newScreenshotBuffer);

        } else {
            console.log('Nenhuma mudança detectada na tabela de notas');
        }

        // Saves the new screenshot
        fs.writeFileSync(screenshotPath, newScreenshotBuffer);

    } else {
        // Saves the first screenshot
        fs.writeFileSync(screenshotPath, newScreenshotBuffer);
        console.log('Primeira execução, salvei o screenshot');
    }
}

/**
 * Sends an email with the new screenshot.
 * @param {Buffer} newScreenshotBuffer - The buffer of the new screenshot.
 */
async function sendEmail(newScreenshotBuffer) {
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: process.env.EMAIL_TO,
        subject: 'Mudança detectada na tabela de notas',
        text: 'Uma mudança foi detectada na tabela de notas.',
        attachments: [
            { filename: screenshotPath, content: newScreenshotBuffer }
        ]
    };
    const email = await resend.emails.send(mailOptions);
    console.log(email);
}


/**
 * Sends an error email with details about the error that occurred during runTask execution.
 *
 * @param {Error} error - The error object that occurred.
 * @return {Promise<void>} A Promise that resolves once the error email is sent.
 */
async function sendErrorEmail(error) {
    if (debug === false) {
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_SENDER,
            to: process.env.EMAIL_TO,
            subject: 'Error running email-unigran-notas',
            text: `An error occurred during runTask execution: \n ${error?.stack ?? error?.message ?? error}`,
        };
        await resend.emails.send(mailOptions);
        console.log('Error email sent successfully');
    } catch (emailError) {
        console.error('Failed to send error email', emailError);
    }
}


// Parse the interval minutes from the environment variable, or use the default interval of 10 minutes if it is not present or not a valid number
const intervalMinutes = parseInt(process.env.INTERVAL_MINUTES, 10);
const defaultIntervalMinutes = 10;
const intervalMilliseconds = (isNaN(intervalMinutes) ? defaultIntervalMinutes : intervalMinutes) * 60 * 1000;

// Run the task immediately, and then set up a recurring interval to run the task at the specified interval

// Run the task immediately
runTask().catch(error => {
    console.error(error);
    sendErrorEmail(error);
});

// Set up a recurring interval to run the task at the specified interval
setInterval(() => {
    // Run the task and catch any errors that occur
    runTask().catch(error => {
        console.error(error);
        sendErrorEmail(error);
    });
}, intervalMilliseconds);
