// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DebugAdapterTracker, DebugSession, window } from 'vscode';
import InstructionView from '../instructionsView/instructionView';

import { EVENT_TYPES } from '../constants/debugAdapter';
import { GET_CURRENT_INSTRUCTION, GET_INSTRUCTIONS } from '../constants/debugSessionCommands';
import { IInstruction } from '../models/IInstruction';

export default class SolidityDebugAdapterTracker implements DebugAdapterTracker {
  private session: DebugSession;
  private instructionView: InstructionView;

  constructor(session: DebugSession) {
    this.session = session;
    this.instructionView = new InstructionView();
  }

  public onDidSendMessage(message: any): void {
    if (message.success === false) {
      window.showErrorMessage('Error occured in debug mode: ' + message.body.error.format);
      return;
    }
    switch (message.event) {
      case EVENT_TYPES.launched: // init instructions after launch
        this.requestForInstructions();
        return;
      case EVENT_TYPES.stopped: // get current instruction on every stop event
        this.requestForCurrentInstruction();
        return;
    }
    switch (message.command) {
      case GET_INSTRUCTIONS:
        this.updateInstructionView(message.body.instructions);
        return;
      case GET_CURRENT_INSTRUCTION:
        this.revealInstruction(message.body.currentInstruction);
        return;
    }
  }

  private requestForInstructions() {
    this.session.customRequest(GET_INSTRUCTIONS);
  }

  private requestForCurrentInstruction() {
    this.session.customRequest(GET_CURRENT_INSTRUCTION);
  }

  private updateInstructionView(instructions: IInstruction[]) {
    this.instructionView.update(instructions);
  }

  private revealInstruction(instruction: IInstruction) {
    this.instructionView.revealInstruction(instruction);
  }
}
