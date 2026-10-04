import fs from 'node:fs';

async function checkSubscriptionQuery() {
  const code = await (await fetch('https://aptiskytich.vn/assets/index-55GF0-ql.js')).text();

  const subIdx = code.indexOf('user_subscriptions');
  if (subIdx !== -1) {
    console.log('user_subscriptions context:');
    console.log(code.substring(Math.max(0, subIdx - 100), Math.min(code.length, subIdx + 500)));
  }

  // Tìm hàm RPC current_user_tier
  const rpcTierIdx = code.indexOf('current_user_tier');
  if (rpcTierIdx !== -1) {
    console.log('\ncurrent_user_tier context:');
    console.log(code.substring(Math.max(0, rpcTierIdx - 100), Math.min(code.length, rpcTierIdx + 300)));
  }
}

checkSubscriptionQuery().catch(console.error);
