#![no_std]

use core::cmp::min;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env,
    Vec,
};

const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;
const INSTANCE_BUMP_AMOUNT: u32 = 200_000;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;
const PERSISTENT_BUMP_AMOUNT: u32 = 200_000;
const MAX_PAGE_SIZE: u32 = 50;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SubscriptionError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    PlanAlreadyExists = 4,
    PlanNotFound = 5,
    InvalidPeriod = 6,
    PlanInactive = 7,
    SubscriptionAlreadyExists = 8,
    SubscriptionNotFound = 9,
    SubscriptionCancelled = 10,
    InvalidPrice = 11,
    RenewTooEarly = 12,
    InvalidPageSize = 13,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    PaymentToken,
    Treasury,
    PlanCount,
    PlanIndex(u32),
    SubscriberCount,
    SubscriberIndex(u32),
    SubscriberSeen(Address),
    Plan(u32),
    Subscription(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Plan {
    pub id: u32,
    pub period_ledgers: u32,
    pub price_stroops: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Subscription {
    pub subscriber: Address,
    pub plan_id: u32,
    pub started_ledger: u32,
    pub next_renewal_ledger: u32,
    pub active: bool,
}

#[contract]
pub struct SbSubscription;

fn bump_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn read_admin(env: &Env) -> Address {
    bump_instance_ttl(env);
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, SubscriptionError::NotInitialized))
}

fn read_payment_token(env: &Env) -> Address {
    bump_instance_ttl(env);
    env.storage()
        .instance()
        .get(&DataKey::PaymentToken)
        .unwrap_or_else(|| panic_with_error!(env, SubscriptionError::NotInitialized))
}

fn read_treasury(env: &Env) -> Address {
    bump_instance_ttl(env);
    env.storage()
        .instance()
        .get(&DataKey::Treasury)
        .unwrap_or_else(|| panic_with_error!(env, SubscriptionError::NotInitialized))
}

fn assert_admin(env: &Env, caller: &Address) {
    let admin = read_admin(env);
    if admin != *caller {
        panic_with_error!(env, SubscriptionError::Unauthorized);
    }
}

fn validate_page_size(env: &Env, limit: u32) {
    if limit > MAX_PAGE_SIZE {
        panic_with_error!(env, SubscriptionError::InvalidPageSize);
    }
}

fn read_plan_count(env: &Env) -> u32 {
    bump_instance_ttl(env);
    env.storage().instance().get(&DataKey::PlanCount).unwrap_or(0)
}

fn write_plan_count(env: &Env, count: u32) {
    bump_instance_ttl(env);
    env.storage().instance().set(&DataKey::PlanCount, &count);
}

fn read_subscriber_count(env: &Env) -> u32 {
    bump_instance_ttl(env);
    env.storage()
        .instance()
        .get(&DataKey::SubscriberCount)
        .unwrap_or(0)
}

fn write_subscriber_count(env: &Env, count: u32) {
    bump_instance_ttl(env);
    env.storage().instance().set(&DataKey::SubscriberCount, &count);
}

fn index_subscriber_if_needed(env: &Env, subscriber: &Address) {
    let seen_key = DataKey::SubscriberSeen(subscriber.clone());
    if env.storage().persistent().has(&seen_key) {
        bump_persistent_ttl(env, &seen_key);
        return;
    }

    let subscriber_count = read_subscriber_count(env);
    let index_key = DataKey::SubscriberIndex(subscriber_count);
    env.storage().persistent().set(&index_key, subscriber);
    env.storage().persistent().set(&seen_key, &true);
    bump_persistent_ttl(env, &index_key);
    bump_persistent_ttl(env, &seen_key);
    write_subscriber_count(env, subscriber_count + 1);
}

fn bump_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(
        key,
        PERSISTENT_LIFETIME_THRESHOLD,
        PERSISTENT_BUMP_AMOUNT,
    );
}

fn charge_subscription_fee(env: &Env, subscriber: &Address, amount: i128) {
    let token_id = read_payment_token(env);
    let treasury = read_treasury(env);
    let token_client = token::TokenClient::new(env, &token_id);
    token_client.transfer(subscriber, &treasury, &amount);
}

fn charge_subscription_fee_with_allowance(env: &Env, subscriber: &Address, amount: i128) {
    let token_id = read_payment_token(env);
    let treasury = read_treasury(env);
    let token_client = token::TokenClient::new(env, &token_id);
    let spender = env.current_contract_address();
    token_client.transfer_from(&spender, subscriber, &treasury, &amount);
}

#[contractimpl]
impl SbSubscription {
    pub fn init(env: Env, admin: Address, payment_token: Address, treasury: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, SubscriptionError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PaymentToken, &payment_token);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        bump_instance_ttl(&env);
    }

    pub fn create_plan(env: Env, caller: Address, plan_id: u32, period_ledgers: u32, price_stroops: i128) {
        caller.require_auth();
        assert_admin(&env, &caller);

        if period_ledgers == 0 {
            panic_with_error!(&env, SubscriptionError::InvalidPeriod);
        }
        if price_stroops <= 0 {
            panic_with_error!(&env, SubscriptionError::InvalidPrice);
        }

        let key = DataKey::Plan(plan_id);
        if env.storage().persistent().has(&key) {
            panic_with_error!(&env, SubscriptionError::PlanAlreadyExists);
        }

        let plan = Plan {
            id: plan_id,
            period_ledgers,
            price_stroops,
            active: true,
        };
        env.storage().persistent().set(&key, &plan);
        let plan_count = read_plan_count(&env);
        let index_key = DataKey::PlanIndex(plan_count);
        env.storage().persistent().set(&index_key, &plan_id);
        bump_persistent_ttl(&env, &index_key);
        write_plan_count(&env, plan_count + 1);
        bump_persistent_ttl(&env, &key);
    }

    pub fn set_plan_status(env: Env, caller: Address, plan_id: u32, active: bool) {
        caller.require_auth();
        assert_admin(&env, &caller);

        let key = DataKey::Plan(plan_id);
        let mut plan: Plan = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::PlanNotFound));

        plan.active = active;
        env.storage().persistent().set(&key, &plan);
        bump_persistent_ttl(&env, &key);
    }

    pub fn subscribe(env: Env, subscriber: Address, plan_id: u32) {
        subscriber.require_auth();

        let plan_key = DataKey::Plan(plan_id);
        let plan: Plan = env
            .storage()
            .persistent()
            .get(&plan_key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::PlanNotFound));

        if !plan.active {
            panic_with_error!(&env, SubscriptionError::PlanInactive);
        }

        charge_subscription_fee(&env, &subscriber, plan.price_stroops);

        let subscription_key = DataKey::Subscription(subscriber.clone());
        if env.storage().persistent().has(&subscription_key) {
            let existing: Subscription = env
                .storage()
                .persistent()
                .get(&subscription_key)
                .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::SubscriptionNotFound));
            if existing.active {
                panic_with_error!(&env, SubscriptionError::SubscriptionAlreadyExists);
            }
        }

        let current_ledger = env.ledger().sequence();
        let subscription = Subscription {
            subscriber: subscriber.clone(),
            plan_id,
            started_ledger: current_ledger,
            next_renewal_ledger: current_ledger + plan.period_ledgers,
            active: true,
        };

        env.storage().persistent().set(&subscription_key, &subscription);
        index_subscriber_if_needed(&env, &subscriber);
        bump_persistent_ttl(&env, &plan_key);
        bump_persistent_ttl(&env, &subscription_key);
    }

    pub fn renew(env: Env, subscriber: Address) {
        let subscription_key = DataKey::Subscription(subscriber.clone());
        let mut subscription: Subscription = env
            .storage()
            .persistent()
            .get(&subscription_key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::SubscriptionNotFound));

        if !subscription.active {
            panic_with_error!(&env, SubscriptionError::SubscriptionCancelled);
        }

        let plan_key = DataKey::Plan(subscription.plan_id);
        let plan: Plan = env
            .storage()
            .persistent()
            .get(&plan_key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::PlanNotFound));
        if !plan.active {
            panic_with_error!(&env, SubscriptionError::PlanInactive);
        }

        let current_ledger = env.ledger().sequence();
        if current_ledger < subscription.next_renewal_ledger {
            panic_with_error!(&env, SubscriptionError::RenewTooEarly);
        }

        charge_subscription_fee_with_allowance(&env, &subscriber, plan.price_stroops);

        subscription.next_renewal_ledger = current_ledger + plan.period_ledgers;
        env.storage().persistent().set(&subscription_key, &subscription);
        bump_persistent_ttl(&env, &plan_key);
        bump_persistent_ttl(&env, &subscription_key);
    }

    pub fn cancel(env: Env, subscriber: Address) {
        subscriber.require_auth();

        let key = DataKey::Subscription(subscriber);
        let mut subscription: Subscription = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::SubscriptionNotFound));

        subscription.active = false;
        env.storage().persistent().set(&key, &subscription);
        bump_persistent_ttl(&env, &key);
    }

    pub fn get_plan(env: Env, plan_id: u32) -> Plan {
        let key = DataKey::Plan(plan_id);
        let plan: Plan = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::PlanNotFound));
        bump_persistent_ttl(&env, &key);
        plan
    }

    pub fn get_subscription(env: Env, subscriber: Address) -> Subscription {
        let key = DataKey::Subscription(subscriber);
        let subscription: Subscription = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, SubscriptionError::SubscriptionNotFound));
        bump_persistent_ttl(&env, &key);
        subscription
    }

    pub fn list_plans(env: Env, offset: u32, limit: u32) -> Vec<Plan> {
        validate_page_size(&env, limit);
        let mut result = Vec::new(&env);
        if limit == 0 {
            return result;
        }

        let plan_count = read_plan_count(&env);
        if offset >= plan_count {
            return result;
        }

        let end = min(plan_count, offset.saturating_add(limit));
        let mut index = offset;
        while index < end {
            let index_key = DataKey::PlanIndex(index);
            let maybe_plan_id: Option<u32> = env.storage().persistent().get(&index_key);
            if let Some(plan_id) = maybe_plan_id {
                let plan_key = DataKey::Plan(plan_id);
                let maybe_plan: Option<Plan> = env.storage().persistent().get(&plan_key);
                if let Some(plan) = maybe_plan {
                    result.push_back(plan);
                    bump_persistent_ttl(&env, &plan_key);
                }
                bump_persistent_ttl(&env, &index_key);
            }
            index += 1;
        }

        result
    }

    pub fn list_subscribers(env: Env, offset: u32, limit: u32) -> Vec<Address> {
        validate_page_size(&env, limit);
        let mut result = Vec::new(&env);
        if limit == 0 {
            return result;
        }

        let subscriber_count = read_subscriber_count(&env);
        if offset >= subscriber_count {
            return result;
        }

        let end = min(subscriber_count, offset.saturating_add(limit));
        let mut index = offset;
        while index < end {
            let index_key = DataKey::SubscriberIndex(index);
            let maybe_subscriber: Option<Address> = env.storage().persistent().get(&index_key);
            if let Some(subscriber) = maybe_subscriber {
                result.push_back(subscriber);
                bump_persistent_ttl(&env, &index_key);
            }
            index += 1;
        }

        result
    }

    pub fn list_subscriptions(env: Env, offset: u32, limit: u32) -> Vec<Subscription> {
        validate_page_size(&env, limit);
        let mut result = Vec::new(&env);
        if limit == 0 {
            return result;
        }

        let subscriber_count = read_subscriber_count(&env);
        if offset >= subscriber_count {
            return result;
        }

        let end = min(subscriber_count, offset.saturating_add(limit));
        let mut index = offset;
        while index < end {
            let subscriber_index_key = DataKey::SubscriberIndex(index);
            let maybe_subscriber: Option<Address> =
                env.storage().persistent().get(&subscriber_index_key);
            if let Some(subscriber) = maybe_subscriber {
                let subscription_key = DataKey::Subscription(subscriber);
                let maybe_subscription: Option<Subscription> =
                    env.storage().persistent().get(&subscription_key);
                if let Some(subscription) = maybe_subscription {
                    result.push_back(subscription);
                    bump_persistent_ttl(&env, &subscription_key);
                }
                bump_persistent_ttl(&env, &subscriber_index_key);
            }
            index += 1;
        }

        result
    }
}

mod test;
