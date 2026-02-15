#![cfg(test)]

use crate::{SbSubscription, SbSubscriptionClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};

#[test]
fn full_subscription_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SbSubscription, ());
    let client = SbSubscriptionClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let treasury = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token.address());
    let token_client = token::TokenClient::new(&env, &token.address());
    token_admin_client.mint(&user, &10_000_000);

    client.init(&admin, &token.address(), &treasury);
    client.create_plan(&admin, &1, &String::from_str(&env, "Starter"), &30, &1_000_000);

    let plan = client.get_plan(&1);
    assert!(plan.active);
    assert_eq!(plan.name, String::from_str(&env, "Starter"));
    assert_eq!(plan.period_ledgers, 30);
    assert_eq!(plan.price_stroops, 1_000_000);

    let user_balance_before_subscribe = token_client.balance(&user);
    let treasury_balance_before_subscribe = token_client.balance(&treasury);

    client.subscribe(&user, &1);

    let user_balance_after_subscribe = token_client.balance(&user);
    let treasury_balance_after_subscribe = token_client.balance(&treasury);
    assert_eq!(
        user_balance_before_subscribe - user_balance_after_subscribe,
        1_000_000
    );
    assert_eq!(
        treasury_balance_after_subscribe - treasury_balance_before_subscribe,
        1_000_000
    );

    let mut sub = client.get_subscription(&user);
    assert!(sub.active);
    assert_eq!(sub.plan_id, 1);
    assert_eq!(sub.next_renewal_ledger - sub.started_ledger, 30);

    let err = client.try_renew(&user);
    assert!(err.is_err());

    let user_balance_before_renew = token_client.balance(&user);
    let treasury_balance_before_renew = token_client.balance(&treasury);
    env.ledger().set_sequence_number(sub.next_renewal_ledger);
    token_client.approve(&user, &contract_id, &1_000_000, &1_000_000);
    client.renew(&user);

    let user_balance_after_renew = token_client.balance(&user);
    let treasury_balance_after_renew = token_client.balance(&treasury);
    assert_eq!(user_balance_before_renew - user_balance_after_renew, 1_000_000);
    assert_eq!(
        treasury_balance_after_renew - treasury_balance_before_renew,
        1_000_000
    );

    sub = client.get_subscription(&user);
    assert_eq!(sub.next_renewal_ledger - sub.started_ledger, 60);

    client.cancel(&user);
    sub = client.get_subscription(&user);
    assert!(!sub.active);
}

#[test]
fn non_admin_cannot_create_plan() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SbSubscription, ());
    let client = SbSubscriptionClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);

    client.init(&admin, &token.address(), &treasury);

    let err = client.try_create_plan(
        &user,
        &1,
        &String::from_str(&env, "Starter"),
        &30,
        &500_000,
    );
    assert!(err.is_err());
}

#[test]
fn cannot_subscribe_to_inactive_plan() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SbSubscription, ());
    let client = SbSubscriptionClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token.address());
    token_admin_client.mint(&user, &5_000_000);

    client.init(&admin, &token.address(), &treasury);
    client.create_plan(&admin, &1, &String::from_str(&env, "Starter"), &30, &1_000_000);
    client.set_plan_status(&admin, &1, &false);

    let err = client.try_subscribe(&user, &1);
    assert!(err.is_err());
}

#[test]
fn renew_requires_next_due_ledger_and_allowance() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SbSubscription, ());
    let client = SbSubscriptionClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token.address());
    let token_client = token::TokenClient::new(&env, &token.address());
    token_admin_client.mint(&user, &8_000_000);

    client.init(&admin, &token.address(), &treasury);
    client.create_plan(&admin, &7, &String::from_str(&env, "Pro"), &15, &2_000_000);
    client.subscribe(&user, &7);

    // Renew cannot happen before due ledger.
    let too_early_err = client.try_renew(&user);
    assert!(too_early_err.is_err());

    let sub = client.get_subscription(&user);
    env.ledger().set_sequence_number(sub.next_renewal_ledger);
    token_client.approve(&user, &contract_id, &2_000_000, &1_000_000);
    let user_before = token_client.balance(&user);
    let treasury_before = token_client.balance(&treasury);
    client.renew(&user);
    assert_eq!(user_before - token_client.balance(&user), 2_000_000);
    assert_eq!(token_client.balance(&treasury) - treasury_before, 2_000_000);
}

#[test]
fn list_plans_and_subscriptions_are_paginated() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SbSubscription, ());
    let client = SbSubscriptionClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token.address());

    client.init(&admin, &token.address(), &treasury);
    client.create_plan(&admin, &1, &String::from_str(&env, "Starter"), &30, &1_000_000);
    client.create_plan(&admin, &2, &String::from_str(&env, "Growth"), &30, &2_000_000);
    client.create_plan(&admin, &3, &String::from_str(&env, "Scale"), &30, &3_000_000);

    let first_page_plans = client.list_plans(&0, &2);
    assert_eq!(first_page_plans.len(), 2);
    assert_eq!(first_page_plans.get(0).unwrap().id, 1);
    assert_eq!(first_page_plans.get(1).unwrap().id, 2);

    let second_page_plans = client.list_plans(&2, &2);
    assert_eq!(second_page_plans.len(), 1);
    assert_eq!(second_page_plans.get(0).unwrap().id, 3);

    let user_1 = Address::generate(&env);
    let user_2 = Address::generate(&env);
    let user_3 = Address::generate(&env);
    token_admin_client.mint(&user_1, &5_000_000);
    token_admin_client.mint(&user_2, &5_000_000);
    token_admin_client.mint(&user_3, &5_000_000);
    client.subscribe(&user_1, &1);
    client.subscribe(&user_2, &2);
    client.subscribe(&user_3, &3);

    let subscribers_page = client.list_subscribers(&1, &2);
    assert_eq!(subscribers_page.len(), 2);
    assert_eq!(subscribers_page.get(0).unwrap(), user_2);
    assert_eq!(subscribers_page.get(1).unwrap(), user_3);

    let subscriptions_page = client.list_subscriptions(&0, &2);
    assert_eq!(subscriptions_page.len(), 2);
    assert_eq!(subscriptions_page.get(0).unwrap().plan_id, 1);
    assert_eq!(subscriptions_page.get(1).unwrap().plan_id, 2);
}
