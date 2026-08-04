const axios = require('axios');

async function test() {
    try {
        const email = process.env.MAIL_USER || 'test@test.com'; // I can't guess the user's password.
    } catch (e) {
        console.error(e);
    }
}
test();
