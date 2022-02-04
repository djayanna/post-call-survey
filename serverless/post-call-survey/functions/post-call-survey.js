const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const Twilio = require('twilio');

exports.handler = TokenValidator(async function(context, event, callback) {
  
  const {callSid, taskSid, queueName } = event;
  const client = context.getTwilioClient();
  const response = new Twilio.Response();

  let url = `https://post-call-survey-2860-dev.twil.io/survey-questions?queueName=${queueName}&callSid=${callSid}&taskSid=${taskSid}&questionIndex=0`;
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  try {
  
    const result= await client.calls(callSid).update({
    method: "POST",
    url:  encodeURI(url),
    });
    response.appendHeader('Content-Type', 'application/json');
    response.setBody(result);

  } catch(error) {
    response.appendHeader('Content-Type', 'plain/text');
    response.setBody(error.message);
    response.setStatusCode(500);
  }

  callback(null, response);
});
