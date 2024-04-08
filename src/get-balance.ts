import { ApiPromise, WsProvider } from "@polkadot/api";
import fs from "fs";
const wsProvider = new WsProvider("wss://rpc-testnet.avail.tools/ws");
// const address = "5DUCywkUNSaYsnacsNvwdxKeoT1KhrS83SmkqueaEszSPCqF"; // Replace with the actual address

async function getBalance(address: string) {
  const api = await ApiPromise.create({ provider: wsProvider });

  // Make the query to the system.account, which returns an AccountInfo
  // We explicitly cast the type here to match what is expected by the TypeScript compiler
  const accountInfo = (await api.query.system.account(address)) as any;

  // Now we destructure the balance from the accountInfo as any type to avoid TypeScript errors
  const {
    nonce,
    data: { free: balance },
  } = accountInfo;

  console.log(
    `The balance for ${address} is ${Number(balance) / 1e18} Plancks`
  );
  await api.disconnect();
  return Number(balance) / 1e18;
}

async function subscribeToBalances(addresses: string[]) {
  const api = await ApiPromise.create({ provider: wsProvider });
  const addressesWith0Balance: string[] = [];
  // Subscribe to balance changes for the provided addresses.
  const unsub = await api.query.system.account.multi(
    addresses,
    (balances: any) => {
      // Iterate over balances and log each account's free balance
      balances.forEach((account: any, index: number) => {
        // console.log(
        //   `The balance for address ${addresses[index]} is ${account.data.free}`
        // );
        if (Number(account.data.free) == 0) {
          //   console.log(addresses[index], "balance 0");
          //   addressesWith0Balance.push(addresses[index]);
        }
      });
    }
  );
  await api.disconnect();

  // Return the unsubscribe function to allow stopping the subscription when needed.
  return addressesWith0Balance;
}

export async function getAddressesWithZeroBalances(
  addresses: string[]
): Promise<string[]> {
  const api = await ApiPromise.create({ provider: wsProvider });

  // 对提供的地址执行一次性查询余额
  const balanceQueries = addresses.map((address) =>
    api.query.system.account(address)
  );

  // 等待所有余额查询完成
  const results = (await Promise.all(balanceQueries)) as any;
  const addressesWith0Balance = results
    .map((account: any, index: any) => {
      console.log(account.data.free);
      if (account.data.free.isZero()) {
        // 如果余额为零，返回对应的地址
        return addresses[index];
      }
      return null;
    })
    .filter((address: any): address is string => address !== null); // 过滤掉非零余额的地址

  // 查询完成后断开连接
  await api.disconnect();

  // 返回余额为零的地址列表
  return addressesWith0Balance;
}

async function batchQuery() {
  const addresses = fs
    .readFileSync(
      "/home/ubuntu/polkadot/avail/src/addressesPengfei.txt",
      "utf-8"
    )
    .split("\n")
    .slice(0, 10);
  console.log("Addresses:", addresses);
  const addressesWith0Balance = await getAddressesWithZeroBalances(addresses);
  console.log("Addresses with 0 balance:", addressesWith0Balance);
}
// batchQuery();
