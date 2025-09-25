module Escrow::PaymentEscrow {
    use std::signer;
    use std::coin;
    use std::aptos_coin::AptosCoin;
    use std::string::String;
    use std::vector;
    use aptos_std::table::Table;

    const STATUS_PENDING: u64 = 0;
    const STATUS_CLAIMED: u64 = 1;

    // Error codes
    const E_ALREADY_CLAIMED: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    const E_INVALID_TRANSACTION: u64 = 4;

    struct EscrowPayment has copy, drop, store {
        sender: address,
        provider: String, // "github", "discord", "figma"
        provider_user_id: String, // GitHub username, Discord ID, etc.
        amount: u64,
        status: u64,
        created_at: u64, // timestamp
    }

    struct EscrowStore has key {
        payments: Table<u64, EscrowPayment>,
        counter: u64,
        total_escrowed: u64,
    }

    public entry fun init(account: &signer) {
        move_to(account, EscrowStore {
            payments: aptos_std::table::new<u64, EscrowPayment>(),
            counter: 0,
            total_escrowed: 0,
        });
    }

    public entry fun deposit_payment(
        sender: &signer, 
        escrow_address: address,
        provider: String, 
        provider_user_id: String, 
        amount: u64
    ) acquires EscrowStore {
        let sender_addr = signer::address_of(sender);
        
        // Transfer funds to escrow account
        let coins = coin::withdraw<AptosCoin>(sender, amount);
        coin::deposit<AptosCoin>(escrow_address, coins);

        // Record the payment in escrow store
        let escrow_store = borrow_global_mut<EscrowStore>(escrow_address);
        
        let payment = EscrowPayment {
            sender: sender_addr,
            provider,
            provider_user_id,
            amount,
            status: STATUS_PENDING,
            created_at: aptos_framework::timestamp::now_seconds(),
        };

        aptos_std::table::add(&mut escrow_store.payments, escrow_store.counter, payment);
        escrow_store.counter = escrow_store.counter + 1;
        escrow_store.total_escrowed = escrow_store.total_escrowed + amount;
    }

    public entry fun claim_payment(
        escrow_signer: &signer,
        payment_id: u64,
        provider: String,
        provider_user_id: String,
        recipient_address: address
    ) acquires EscrowStore {
        let escrow_address = signer::address_of(escrow_signer);
        let escrow_store = borrow_global_mut<EscrowStore>(escrow_address);
        
        assert!(aptos_std::table::contains(&escrow_store.payments, payment_id), E_INVALID_TRANSACTION);
        
        let payment_ref = aptos_std::table::borrow_mut(&mut escrow_store.payments, payment_id);
        
        // Verify payment is pending
        assert!(payment_ref.status == STATUS_PENDING, E_ALREADY_CLAIMED);
        
        // Verify provider and user ID match
        assert!(payment_ref.provider == provider, E_NOT_AUTHORIZED);
        assert!(payment_ref.provider_user_id == provider_user_id, E_NOT_AUTHORIZED);

        // Update status
        payment_ref.status = STATUS_CLAIMED;
        escrow_store.total_escrowed = escrow_store.total_escrowed - payment_ref.amount;

        // Transfer funds to recipient
        let coins = coin::withdraw<AptosCoin>(escrow_signer, payment_ref.amount);
        coin::deposit<AptosCoin>(recipient_address, coins);
    }

    #[view]
    public fun get_payment_status(escrow_address: address, payment_id: u64): u64 acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_address);
        let payment = aptos_std::table::borrow(&escrow_store.payments, payment_id);
        payment.status
    }

    #[view]
    public fun get_payment_by_id(escrow_address: address, payment_id: u64): (address, String, String, u64, u64, u64) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_address);
        let payment = aptos_std::table::borrow(&escrow_store.payments, payment_id);
        (payment.sender, payment.provider, payment.provider_user_id, payment.amount, payment.status, payment.created_at)
    }

    #[view]
    public fun get_payments_by_provider(escrow_address: address, provider: String, provider_user_id: String): vector<u64> acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_address);
        let matching_payments = vector::empty<u64>();

        let counter = 0;
        while (counter < escrow_store.counter) {
            if (aptos_std::table::contains(&escrow_store.payments, counter)) {
                let payment = aptos_std::table::borrow(&escrow_store.payments, counter);
                if (payment.provider == provider && payment.provider_user_id == provider_user_id) {
                    vector::push_back(&mut matching_payments, counter);
                };
            };
            counter = counter + 1;
        };

        matching_payments
    }

    #[view]
    public fun get_all_payments(escrow_address: address): (vector<address>, vector<String>, vector<String>, vector<u64>, vector<u64>, vector<u64>, vector<u64>) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_address);
        let senders = vector::empty<address>();
        let providers = vector::empty<String>();
        let provider_user_ids = vector::empty<String>();
        let amounts = vector::empty<u64>();
        let statuses = vector::empty<u64>();
        let created_ats = vector::empty<u64>();
        let payment_ids = vector::empty<u64>();

        let counter = 0;
        while (counter < escrow_store.counter) {
            if (aptos_std::table::contains(&escrow_store.payments, counter)) {
                let payment = aptos_std::table::borrow(&escrow_store.payments, counter);
                vector::push_back(&mut senders, payment.sender);
                vector::push_back(&mut providers, payment.provider);
                vector::push_back(&mut provider_user_ids, payment.provider_user_id);
                vector::push_back(&mut amounts, payment.amount);
                vector::push_back(&mut statuses, payment.status);
                vector::push_back(&mut created_ats, payment.created_at);
                vector::push_back(&mut payment_ids, counter);
            };
            counter = counter + 1;
        };

        (senders, providers, provider_user_ids, amounts, statuses, created_ats, payment_ids)
    }

    #[view]
    public fun get_escrow_stats(escrow_address: address): (u64, u64) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(escrow_address);
        (escrow_store.total_escrowed, escrow_store.counter)
    }
}
