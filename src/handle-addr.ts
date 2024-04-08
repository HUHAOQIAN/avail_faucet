import fs from "fs";
import { getAddressFromMnemonic } from "./get-addr";
const mnemonicRaw = fs
  .readFileSync("/home/ubuntu/polkadot/avail/src/mnemonics.txt", "utf-8")
  .split("\n");
const mnemonic = mnemonicRaw
  .map((mnemonic) => mnemonic.trim())
  .filter((mnemonic) => mnemonic.length > 0);
async function getAllAddress() {
  const addresses = await Promise.all(
    mnemonic.map(async (mnemonic) => {
      const address = await getAddressFromMnemonic(mnemonic);
      return address;
    })
  );
  console.log("Addresses:", addresses);
  fs.writeFileSync(
    "/home/ubuntu/polkadot/avail/src/addressesPengfei.txt",
    addresses.join("\n")
  );
}
getAllAddress();
