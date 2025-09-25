// Minimal Payment Escrow Contract
// Only 2 functions: send_money and claim_money
// Maintains transaction log table with statuses

module Escrow::PaymentEscrow {
    use std::signer;
    use std::coin;
    use std::aptos_coin::AptosCoin;
    use std::vector;
    use aptos_std::table::Table;

    /// Transaction status enum
    const STATUS_PENDING: u64 = 0;
    const STATUS_CLAIMED: u64 = 1;

    /// Transaction record structure
    struct TransactionRecord has copy, drop, store {
        sender: address,
        amount: u64,
        status: u64,
    }

    /// Resource holding all transactions in a table
    struct EscrowStore has key {
        txs: Table<u64, TransactionRecord>,
        counter: u64,
    }

    /// Initialize escrow storage
    public entry fun init(account: &signer) {
        move_to(account, EscrowStore {
            txs: aptos_std::table::new<u64, TransactionRecord>(),
            counter: 0
        });
    }

    /// Deposit coins into escrow (Function 1)
    public entry fun send_money(sender: &signer, amount: u64) acquires EscrowStore {
        let sender_addr = signer::address_of(sender);
        let escrow_store = borrow_global_mut<EscrowStore>(sender_addr);

        let coins = coin::withdraw<AptosCoin>(sender, amount);
        coin::deposit<AptosCoin>(sender_addr, coins);

        let tx = TransactionRecord {
            sender: sender_addr,
            amount,
            status: STATUS_PENDING,
        };

        aptos_std::table::add(&mut escrow_store.txs, escrow_store.counter, tx);
        escrow_store.counter = escrow_store.counter + 1;
    }

    /// Claim coins to destination address (Function 2)
    public entry fun claim_money(
        validator: &signer,
        escrow_owner: address,
        tx_id: u64,
        destination: address
    ) acquires EscrowStore {
        let escrow_store = borrow_global_mut<EscrowStore>(escrow_owner);
        let tx_ref = aptos_std::table::borrow_mut(&mut escrow_store.txs, tx_id);

        assert!(tx_ref.status == STATUS_PENDING, 1); // already claimed

        tx_ref.status = STATUS_CLAIMED;

        let coins = coin::withdraw<AptosCoin>(validator, tx_ref.amount);
        coin::deposit<AptosCoin>(destination, coins);
    }

    /// View transaction status
    public fun get_transaction_status(escrow_owner: address, tx_id: u64): u64 acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_owner);
        let tx = aptos_std::table::borrow(&escrow_store.txs, tx_id);
        tx.status
    }

    /// View all transactions (returns array of [sender, amount, status, tx_id])
    public fun get_all_transactions(escrow_owner: address): (vector<address>, vector<u64>, vector<u64>, vector<u64>) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_owner);
        let senders = vector::empty<address>();
        let amounts = vector::empty<u64>();
        let statuses = vector::empty<u64>();
        let tx_ids = vector::empty<u64>();

        let counter = 0;
        while (counter < escrow_store.counter) {
            if (aptos_std::table::contains(&escrow_store.txs, counter)) {
                let tx = aptos_std::table::borrow(&escrow_store.txs, counter);
                vector::push_back(&mut senders, tx.sender);
                vector::push_back(&mut amounts, tx.amount);
                vector::push_back(&mut statuses, tx.status);
                vector::push_back(&mut tx_ids, counter);
            };
            counter = counter + 1;
        };

        (senders, amounts, statuses, tx_ids)
    }
}
