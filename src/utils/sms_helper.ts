const accountSid = '';
const authToken = '[]';
const client = require('')(accountSid, authToken);

client.verify.v2.services("")
    .verifications
    .create({ to: '+660804929132', channel: 'sms' })
    .then((verification: any) => console.log(verification.sid));