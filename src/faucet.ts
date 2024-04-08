import axios from "axios";
import { getTaskResult } from "./captcha-result";
import { SocksProxyAgent } from "socks-proxy-agent";
import fs from "fs";
import { getAddressesWithZeroBalances } from "./get-balance";
import * as dotenv from "dotenv";
dotenv.config();
async function getIp() {
  const url = process.env.SKY_IP_URL!;

  const response = await axios.get(url);
  const ip = `socks://${response.data.data[0]}`;
  return ip;
}
const headers = {
  Accept: "text/x-component",
  "Content-Type": "text/plain;charset=UTF-8",
  "Next-Action": "b17bfcc420ae80ad3e132f39c98cdd726fe756d6",
  "Next-Router-State-Tree":
    "%5B%22%22%2C%7B%22children%22%3A%5B%22_PAGE_%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
  Origin: "https://faucet.avail.tools",
  Referer: "https://faucet.avail.tools/",
  "Sec-Ch-Ua":
    '"Google Chrome";v="123", "Not-A-Brand";v="8", "Chromium";v="123"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
};

async function claim(ip: string) {
  while (true) {
    try {
      const captchaSolution = await getTaskResult();
      const payload = [captchaSolution];
      console.log("Payload:", payload, "ok!");
      const response = await axios.post(
        "https://faucet.avail.tools/",
        payload,
        {
          headers: headers,
          httpAgent: new SocksProxyAgent(ip),
          httpsAgent: new SocksProxyAgent(ip),
        }
      );

      console.log("Response:", response.data, "ok!");
      return response.data;
    } catch (error: any) {
      console.error(
        "Error in main:",
        error.message,
        new Date().toLocaleTimeString()
      );
      await sleep(10 * 1000);
    }
  }
}
export async function limitConcurrency(
  funcs: (() => Promise<any>)[],
  limit: number
) {
  let i = 0;
  // Define the type of the array that will hold the results of the promises.
  const results: Promise<any>[] = [];
  const running = new Set();
  let count = 0;

  const next = async () => {
    if (i === funcs.length) return;
    const func = funcs[i++];
    const promise = func();
    results.push(promise);
    running.add(promise);
    count++;
    if (running.size < limit) {
      next();
    }
    await promise;
    running.delete(promise);
    if (running.size < limit) {
      next();
    }
  };

  for (let j = 0; j < limit && j < funcs.length; j++) {
    next();
  }

  // Wait for all promises to be added to running
  while (count < funcs.length) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Wait for all promises to finish
  await Promise.all([...running]);

  return Promise.all(results);
}
async function getFaucet(address: string) {
  try {
    const ip = await getIp();
    console.log("IP:", ip);
    await claim(ip);
    const url = `https://faucet.avail.tools/api/faucet/claim?address=${address}`;
    const response = await axios.get(url, {
      httpAgent: new SocksProxyAgent(ip),
      httpsAgent: new SocksProxyAgent(ip),
    });
    console.log("Response:", response.data, "ok!");
    return true;
  } catch (e: any) {
    console.error(
      address,
      e.response.data.message,
      new Date().toLocaleTimeString()
    );
  }
}
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const addresses = fs
    .readFileSync(
      "/home/ubuntu/polkadot/avail/src/addressesPengfei.txt",
      "utf-8"
    )
    .split("\n")
    .slice(0, 300);
  console.log("Addresses:", addresses);
  while (true) {
    const res = await getFaucet(addresses[0]);
    if (res) {
      break;
    }
    console.log("Sleeping for 30 minutes");
    await sleep(60 * 30 * 1000);
  }
  const addressesWith0Balance = await getAddressesWithZeroBalances(addresses);
  const funcs = addressesWith0Balance.map(
    (address) => () => getFaucet(address)
  );
  await limitConcurrency(funcs, 10);
  //   await Promise.all(addressesWith0Balance.map((address) => getFaucet(address)));
}
main();
