const TokenValidator = require("twilio-flex-token-validator").functionValidator;
const VoiceResponse = require("twilio").twiml.VoiceResponse;

// validate token
exports.handler = async function (context, event, callback) {
  let twiml = new VoiceResponse();

  let { queueName, callSid, taskSid, Digits, questionIndex, newTaskSid , attributes} = event;

  // helper to append a new "Say" verb with alice voice
  function say(text) {
    twiml.say({ voice: "alice" }, text);
  }

  questionIndex = parseInt(questionIndex);

  if (questionIndex === 0) {
    say(
      "Thank you for taking our survey. Please listen carefully to the following questions."
    );
    let newTask = await createTask(context, taskSid, queueName);
    newTaskSid = newTask.sid;
    attributes = newTask.attributes;
  } else {
    // update score
    let task = await updateTask(context, newTaskSid, questionIndex, Digits, attributes);
    attributes = task.attributes;
  }

  if (questionIndex === survey().length) {
    await completeTask(context, newTaskSid, attributes);
    say('Thank you for taking this survey. Goodbye!');

  } else {

    // TODO: validate questionIndex
    var question = survey()[parseInt(questionIndex)];
    say(question.text);

    const nextQuestion = questionIndex + 1;

    twiml.gather({
      timeout: 10,
      numDigits: 1,
      method: "POST",
      action: encodeURI(
        `https://${context.DOMAIN_NAME}/survey-questions?callSid=${callSid}&taskSid=${taskSid}&newTaskSid=${newTaskSid}&questionIndex=${nextQuestion}&attributes=${attributes}`
      ),
    });
  }

  callback(null, twiml);
};

const createTask = async (context, taskSid, queueName) => {

  console.log('qn - ' + queueName);
  const client = context.getTwilioClient();
  let conversations = {};
  conversations.conversation_id = taskSid;
  conversations.queue = queueName;
  conversations.virtual = "Yes";
  conversations.abandoned = "Yes";
  conversations.ivr_time = 0;
  conversations.talk_time = 0;
  conversations.ring_time = 0;
  conversations.queue_time = 0;
  conversations.wrap_up_time = 0;
  conversations.kind = "Survey";

  let task = await client.taskrouter
    .workspaces(context.TR_WORKSPACE_SID)
    .tasks.create({
      attributes: JSON.stringify({ conversations }),
      workflowSid: context.TR_SURVEY_WORKFLOW_SID,
      timeout: 600,
    });

  return task;
};

const completeTask = async (context, taskSid, attributes) => {
    const client = context.getTwilioClient();

    attributes = JSON.parse(attributes);
    attributes.conversations.abandoned = "No";

    return await client.taskrouter.workspaces(context.TR_WORKSPACE_SID)
    .tasks(taskSid)
    .update({
        attributes: JSON.stringify(attributes)
    })
  };
  

const updateTask = async (context, taskSid, questionIndex, digits, attributes) => {
    const client = context.getTwilioClient();
    attributes = JSON.parse(attributes);

    const text = survey()[parseInt(questionIndex)-1].text;

    switch (questionIndex) {
        case 1:
            attributes.conversations.conversation_attribute_1 = text;
            attributes.conversations.conversation_measure_1 = digits;
          break;
        case 2:
            attributes.conversations.conversation_attribute_2 = text;
            attributes.conversations.conversation_measure_2 = digits;
          break;
          case 3:
            attributes.conversations.conversation_attribute_3 = text;
            attributes.conversations.conversation_measure_3 = digits;
          break;
          case 4:
            attributes.conversations.conversation_attribute_4 = text;
            attributes.conversations.conversation_measure_4 = digits;
          break;
        default:
          console.log(`Sorry, we are out of ${questionIndex}.`);
      }
    
    return await client.taskrouter.workspaces(context.TR_WORKSPACE_SID)
    .tasks(taskSid)
    .update({
        attributes: JSON.stringify(attributes)
    })
}

const survey = () => {
  return [
    {
      text: "How satisfied were you with our service team member?",
      type: "number",
    },
    {
      text: "How courteous would you say our service team member was?",
      type: "number",
    },
    {
      text: "How knowledgeable would you say our service team member was?",
      type: "number",
    },
    {
      text: "How effective would you say the service team member’s communication was?",
      type: "number",
    },
  ];
};
