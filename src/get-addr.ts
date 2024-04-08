import { mnemonicToMiniSecret } from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";

export async function getAddressFromMnemonic(mnemonic: string) {
  // 确保加密模块已初始化
  await cryptoWaitReady();

  // 创建Keyring实例，用于生成密钥对
  const keyring = new Keyring({ type: "sr25519" });

  // 使用助记词生成mini-secret（私钥种子）
  const seed = mnemonicToMiniSecret(mnemonic);

  // 使用seed生成密钥对
  const pair = keyring.addFromSeed(seed);

  // 输出地址
  //   console.log(`The address is: ${pair.address}`);
  return pair.address;
}
