import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import * as dotenv from "dotenv";
dotenv.config();
const url = "https://api.yescaptcha.com/createTask";
const websiteKey = "6Lc94akpAAAAAGaxYMKiA0qBqL10gSblHpeyD7xZ"; //目标网站的 reCAPTCHA v3 site key  https://yescaptcha.atlassian.net/wiki/spaces/YESCAPTCHA/pages/12746875/reCaptcha
const websiteURL = "https://faucet.avail.tools/"; // 目标网站的 URL
const clientKey = process.env.YESCAPTCHA_KEY!; // 你的 YesCaptcha 客户端密钥

async function createTask() {
  const data = {
    clientKey: clientKey,
    task: {
      websiteURL: websiteURL,
      websiteKey: websiteKey,
      type: "RecaptchaV3TaskProxyless",
    },
  };
  const res = await axios.request({
    url: url,
    method: "POST",
    data: data,
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data.taskId;
}
export async function getTaskResult() {
  const taskId = await createTask();
  let times = 0;
  while (times < 120) {
    try {
      const url = "https://api.yescaptcha.com/getTaskResult";
      const data = {
        clientKey: clientKey,
        taskId: taskId,
      };

      const response = await axios.request({
        url: url,
        method: "POST",
        data: data,
        headers: {
          "Content-Type": "application/json",
        },
        // httpAgent: new SocksProxyAgent(ip),
        // httpsAgent: new SocksProxyAgent(ip),
      });

      const result = response.data;
      const solution = result.solution;
      if (solution) {
        const response = solution.gRecaptchaResponse;
        if (response) {
          return response;
        }
      } else {
      }
    } catch (error) {
      console.log(error);
    }
    times += 3;
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒钟
  }
}

// async function captchaRecaptcha(): Promise<string> {
//   const TWO_CAPTCHA_KEY = "e2ac59909b972534fcc69709368a7e6e";
//   const twoCaptcha = new Solver(TWO_CAPTCHA_KEY);
//   try {
//     const result = await twoCaptcha.recaptcha(websiteKey, websiteURL);
//     console.log("Captcha solved:", result.data);
//     return result.data;
//   } catch (error) {
//     console.error("Error solving captcha:", error);
//     throw error;
//   }
// }
// captchaRecaptcha();
