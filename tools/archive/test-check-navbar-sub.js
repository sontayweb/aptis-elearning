import fs from 'node:fs';

async function checkNavbarSub() {
  const code = await (await fetch('https://aptiskytich.vn/assets/Navbar-gnKTWkn9.js')).text();

  const subIdx = code.indexOf('user_subscriptions');
  if (subIdx !== -1) {
    console.log('user_subscriptions in Navbar:');
    console.log(code.substring(Math.max(0, subIdx - 100), Math.min(code.length, subIdx + 500)));
  }
}

checkNavbarSub().catch(console.error);
