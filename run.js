const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const browserManager = require('./BrowserManager');
const { setTimeout } = require('node:timers/promises');

puppeteer.use(StealthPlugin());
puppeteer.use(require('puppeteer-extra-plugin-click-and-wait')())

var page;
var targets;
var browser;

async function start() {
  browser = await browserManager.getBrowser();
  page = await browser.newPage();
  targets = await browser.targets();
  // await page.setViewport({ width: 1920, height: 1080 });

  const capturedXHR = [];

  await page.setRequestInterception(true);

  page.on('request', interceptedRequest => {
    const url = interceptedRequest.url();
    if (interceptedRequest.resourceType() === 'fetch') {
      if (url.startsWith('https://www.urbtix.hk/api/internet/log/add')) {
        // Capture request headers and body
        const headers = interceptedRequest.headers();
        const body = interceptedRequest.postData();
        // Store captured XHR data
        capturedXHR.push({ url, headers, body });
      }

    }
    interceptedRequest.continue();
  });


  const waitingForAccessURL = ['/session/landing-timer/', 'msg.urbtix.hk', 'busy.urbtix.hk', '/logout'];

  const specialURL = ['/session/landing']

  page.on('response', async (response) => {
    const url = response.url();
    for (const waitingURL of waitingForAccessURL) {
      if (url.includes(waitingURL)) {
        console.log("Retry to redirect main page.")
        try {
          await page.goto("https://www.urbtix.hk", { 'waitUntil': 'networkidle0' });
          await page.waitUntil(2000);
        } catch (error) {
          console.error("Error occurred while navigating:", error);
        }
        break; // Exit the loop after navigating
      }
    }

    for (const waitingURL of specialURL) {
      if (url.includes(waitingURL)) {
        console.log("special case");
      }
    }
  });

  await page.goto("https://www.urbtix.hk/member-login/", { 'waitUntil': 'networkidle2' });

  await checkLogin();

  var cookie = capturedXHR[0].headers['cookie'];
  var XClientId = capturedXHR[0].headers['x-client-id'];
  var XToken = capturedXHR[0].headers['x-token'];
  var sw8 = capturedXHR[0].headers['sw8'];

  console.log(cookie)
  console.log(XClientId)
  console.log(XToken)
  console.log(sw8)

  const axios = require('axios');
  let data = JSON.stringify([
    {
      "autoSelectItem": [
        {
          "eventId": 11657,
          "performanceId": 52732,
          "priceZoneId": 94,
          "ticketNumber": 1,
          "ticketTypeId": 2810
        }
      ],
      "exchange": false,
      "needLink": true,
      "priceZoneId": 94
    }
  ]);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.urbtix.hk/api/internet/performance/autoSelect?registerNum&registerToken&AfbF5fe=65BOOIZ14oyJXlvFGRB.ebqziGnLv.iWupB98GT_15nmNMG08Z65xwgwZ5BEwngZTULz.WTaGDR7elmDVmQtqip.9ozSCHNJMSOYNH8AWt9t5q1M_4yW.F_Vt2H5N9acgGXCjsrYMh3d2zU6NZbjzKg1P4W.xgoNfFu7AocE9nQ8UW0jhXG.E9fwWwV48GYZUMU48iKTMtYwN1LFPFW6jx3CYHoV8NVgRb4g7D26FxWIHnMDcj2O63quOe6LudZtldybQ_XQLGCH2Vpvdk9J5rqH6fL35JjwdGlmU_WuwWTqJEREXaNi6uaHtCmXQv5BHhxQBD.8PomQ.15zzhsYY5Js2.Bg7Imm_uZVukF8BhxQiPA9qYZNAiLMuHZVJPSRUmCCM4p3Zco7319yaI6uRrq',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Cookie': `${cookie}`,
      'Origin': 'https://www.urbtix.hk',
      'Referer': 'https://www.urbtix.hk/performance-detail?eventId=11807&performanceId=52732',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'X-Client-ID': `${XClientId}`,
      'X-Client-ID-Enc': 'wuGWr/CuOlqlxYTJcjXJBLmMwufXd3bVnyST5RliFCu7/vn5PrrUEntXHuSGmfSc',
      'X-Client-Type': '1',
      'X-Locale': 'zh_HK',
      'X-Locale-Language': 'null',
      'X-Sales-Channel': '1',
      'X-Token': `${XToken}`,
      'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sw8': `${sw8}`
    },
    data: data
  };

  axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });



  //await browser.close();
};

async function checkLogin() {
  console.log('checking login status')
  const cookies = await page.cookies();
  const targetCookie = cookies.find(cookie => cookie.name === 'X-Token' && cookie.domain === 'www.urbtix.hk');

  if (!targetCookie) {
    login();
  }
}

async function login() {
  try {
    console.log("login")
    await page.waitForSelector('input[name="loginId"]');
    await page.type('input[name="loginId"]', 'account ID here');
    await page.type('input[name="password"]', 'password here');
    await page.click('.login-button');

    await captcha();

    console.log("login success");
  } catch (error) {
    console.error("Error occurred during login:", error);
  }
}

async function ticket() {
  console.log("ticking processing.")



}

async function captcha() {
  const elementHandle = await page.waitForSelector('#tcaptcha_iframe_dy')
  const frame = await elementHandle.contentFrame();
  await frame.waitForSelector('#slideBg');

  await frame.waitForFunction(() => {
    const element = document.querySelector('div#slideBg');
    if (!element) return false;
    const style = element.getAttribute('style');
    return /background-image: url\(\"(.*?)\"\);/.test(style);
  }, { timeout: 5000 }); // Adjust timeout as necessary

  const style = await frame.evaluate(() => {
    const element = document.querySelector('div#slideBg');
    return element ? element.getAttribute('style') : '';
  });

  const p = /background-image: url\(\"(.*?)\"\);/;
  const match = p.exec(style);

  if (match && match[1]) {
    console.log("Background image URL:", match[1]);
  } else {
    console.log("No background image URL found");
  }

  let big = match[1];

  const bigUrl = big.includes('https') ? big : 'https://turing.captcha.qcloud.com/' + big;

  const imgPath = './picture/tupian.jpg';

  await downloadImage(bigUrl, imgPath)
    .then(() => console.log('Image downloaded successfully'))
    .catch(err => console.error('Error downloading image:', err));

  const dis = await callPythonScript(imgPath);

  console.log(`Calculated distance (dis): ${dis}`);

  const smallButton = await frame.waitForSelector('#tcOperation > div:nth-child(6)');
  const smallButtonBox = await smallButton.boundingBox();

  console.log(`Slider2 position - x: ${smallButtonBox.x}, y: ${smallButtonBox.y}`);

  const disPx = dis * 340 / 672

  console.log(`Displacement in pixels (disPx): ${disPx}`);

  await page.mouse.move(smallButtonBox.x + smallButtonBox.width / 2, smallButtonBox.y + smallButtonBox.height / 2);
  await page.mouse.down();

  let gen = _moveTrace(disPx)

  for (let ret of gen) {
    console.log(`pos X : ${smallButtonBox.x + ret}`);
    await page.mouse.move(smallButtonBox.x + ret, smallButtonBox.y)
  }

  await page.mouse.up();
}

let _moveTrace = function* (dis) {
  let trace = []
  let t0 = 0.2
  let curr = 0
  let step = 0
  let a = 0.8
  while (curr < dis) {
    let t = t0 * (++step)
    curr = parseFloat((1 / 2 * a * t * t).toFixed(2))
    trace.push(curr)
  }
  for (let i = 0; i < trace.length; ++i) {
    yield trace[i]
  }
}


start();



//--

const fs = require('fs');
const { Socket } = require('node:dgram');
async function downloadImage(url, filePath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
}
const { exec } = require('child_process');
function callPythonScript(imgPath) {
  return new Promise((resolve, reject) => {
    exec(`python3 img.py ${imgPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(`Error: ${error.message}`);
      } else if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return reject(`Stderr: ${stderr}`);
      } else {
        console.log(`Stdout: ${stdout}`);
        const output = stdout.trim().split('\n');
        const result = parseInt(output[output.length - 1], 10); // Get the last line and parse it as an integer
        console.log(`Parsed result: ${result}`);
        resolve(result);
      }
    });
  });
}
