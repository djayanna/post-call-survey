import React from "react";
import { VERSION } from "@twilio/flex-ui";
import { FlexPlugin } from "flex-plugin";

const PLUGIN_NAME = "PostCallSurveyPlugin";

export default class PostCallSurveyPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  async init(flex, manager) {
    this.registerReducers(manager);

    flex.Actions.addListener("beforeHangupCall", async (payload) => {
      console.log("before call hang up");
      // TODO: check for survey attribute = true 
      await this.updateCall(
        manager,
        payload.task.attributes.call_sid,
        payload.task.taskSid,
        payload.task.queueName
      );
    });
  }

  async updateCall(manager, callSid, taskSid, queueName) {
    const url = `${process.env.REACT_APP_SERVICE_BASE_URL}/post-call-survey`;
    const body = {
      Token: manager.store.getState().flex.session.ssoTokenPayload.token,
      callSid: callSid,
      taskSid: taskSid,
      queueName: queueName,
    };
    const options = {
      method: "POST",
      body: new URLSearchParams(body),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    };

    try {
      const response = await fetch(url, options);
      console.log(response);
    } catch (error) {
      console.error(`Error redirecting call ${callSid}.`, error);
    }
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint-disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`
      );
      return;
    }
  }
}
