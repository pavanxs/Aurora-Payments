## Create Aptos Dapp Boilerplate Template

The Boilerplate template provides a starter dapp with all necessary dapp infrastructure and a simple wallet info implementation, transfer APT and a simple message board functionality to send and read a message on chain.

## Read the Boilerplate template docs
To get started with the Boilerplate template and learn more about the template functionality and usage, head over to the [Boilerplate template docs](https://learn.aptoslabs.com/en/dapp-templates/boilerplate-template) 


## The Boilerplate template provides:

- **Folder structure** - A pre-made dapp folder structure with a `src` (frontend) and `contract` folders.
- **Dapp infrastructure** - All required dependencies a dapp needs to start building on the Aptos network.
- **Wallet Info implementation** - Pre-made `WalletInfo` components to demonstrate how one can use to read a connected Wallet info.
- **Transfer APT implementation** - Pre-made `transfer` components to send APT to an address.
- **Message board functionality implementation** - Pre-made `message` components to send and read a message on chain
- **Payment Escrow System** - Full-featured escrow functionality with off-chain validation support


## What tools the template uses?

- React framework
- shadcn/ui + tailwind for styling
- Aptos TS SDK
- Aptos Wallet Adapter
- Node based Move commands
- [Next-pwa](https://ducanh-next-pwa.vercel.app/)

## What Move commands are available?

The tool utilizes [aptos-cli npm package](https://github.com/aptos-labs/aptos-cli) that lets us run Aptos CLI in a Node environment.

Some commands are built-in the template and can be ran as a npm script, for example:

- `npm run move:publish` - a command to publish the Move contract
- `npm run move:test` - a command to run Move unit tests
- `npm run move:compile` - a command to compile the Move contract
- `npm run move:upgrade` - a command to upgrade the Move contract
- `npm run dev` - a command to run the frontend locally
- `npm run deploy` - a command to deploy the dapp to Vercel

For all other available CLI commands, can run `npx aptos` and see a list of all available commands.

---

# Payment Escrow System

A minimal Aptos-based payment escrow system with off-chain validation support.

## Features

- **Send Money to Escrow**: Deposit APT tokens into escrow with automatic transaction logging
- **Claim Money**: Release funds to any destination address with off-chain validation
- **Transaction Tracking**: Full transaction history with status monitoring
- **Off-chain Validation**: Designed for millisecond validation by web2/off-chain systems

## Contract Functions

### 1. `init()`
Initialize the escrow storage for your account.

### 2. `send_money(amount: u64)`
- Send APT tokens to escrow
- Creates a pending transaction record
- Funds are held in escrow until claimed

### 3. `claim_money(escrow_owner: address, tx_id: u64, destination: address)`
- Claim funds from escrow to any destination address
- Requires off-chain validation (performed by your web2 system)
- Updates transaction status to claimed

### 4. `get_transaction_status(escrow_owner: address, tx_id: u64): u64`
- View the status of a specific transaction
- Returns: 0 (PENDING) or 1 (CLAIMED)

### 5. `get_all_transactions(escrow_owner: address): (vector<address>, vector<u64>, vector<u64>, vector<u64>)`
- Get all transactions for an escrow owner
- Returns: (senders, amounts, statuses, tx_ids)

## How It Works

1. **User deposits funds** → `send_money()` creates a PENDING transaction
2. **Off-chain validation** → Your web2 validator system validates the transaction in milliseconds
3. **Validator claims funds** → `claim_money()` releases funds to the specified destination address
4. **Transaction tracking** → All operations are logged with status updates

## Architecture

The escrow system uses a minimal design with:
- **Transaction Table**: Stores all transaction records with sender, amount, and status
- **Two Core Functions**: Only `send_money` and `claim_money` on-chain
- **Off-chain Logic**: Validation happens in your web2 backend for speed
- **Status Tracking**: PENDING → CLAIMED lifecycle

## Security Features

- Funds are held in escrow until explicitly claimed
- Transaction validation prevents double-claiming
- All operations are logged for audit trails
- Off-chain validation enables complex business logic

## Use Cases

- **Payment Processing**: Hold payments until validation completes
- **Marketplace Escrow**: Secure transactions between buyers/sellers
- **Subscription Services**: Validate before releasing funds
- **Cross-border Payments**: Multi-step validation workflows
