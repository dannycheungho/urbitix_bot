const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-click-and-wait')())

const path = require('path');

class BrowserManager {

  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (this.browser) {
      console.log('Reusing existing browser instance');
      return this.browser;
    }
    this.browser = await puppeteer.launch({
      args: [
        `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36`,
        '--disable-animations',
        '--disable-background-networking',
        '--disable-backgrounding-occluded-windows',
        '--disable-bookmark-reordering',
        '--disable-boot-animation',
        '--disable-breakpad',
        '--disable-canvas-aa',
        '--disable-client-side-phishing-detection',
        '--disable-cloud-import',
        '--disable-component-cloud-policy',
        '--disable-component-update',
        '--disable-composited-antialiasing',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-device-discovery-notifications',
        '--disable-dinosaur-easter-egg',
        '--disable-domain-reliability',
        '--disable-features=IsolateOrigins,site-per-process,TranslateUI,PrivacySandboxSettings4',
        '--disable-infobars',
        '--disable-logging',
        '--disable-login-animations',
        '--disable-login-screen-apps',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-renderer-backgrounding',
        '--disable-session-crashed-bubble',
        '--disable-smooth-scrolling',
        '--disable-suggestions-ui',
        '--disable-sync',
        '--disable-translate',
        '--hide-crash-restore-bubble',
        '--lang=zh-TW',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-service-autorun',
        '--password-store=basic',
        '--start-maximized'
      ],
      headless: false,
      userDataDir: './userData'
    });
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new BrowserManager();
