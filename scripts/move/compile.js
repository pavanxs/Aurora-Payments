require("dotenv").config();
const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function compile() {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: "contract",
    namedAddresses: {
      // Compile modules with account addresses
      message_board_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS || "0x1",
      Escrow: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS || "0x1",
    },
  });
}
compile();
