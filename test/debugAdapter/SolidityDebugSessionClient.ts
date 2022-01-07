// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { SolidityDebugSession } from "../../src/debugAdapter/debugSession";

const baseDebugAdapterResponseMock = { request_seq: 1, success: true, command: "", seq: 1, type: "" };

export class SolidityDebugSessionClient extends SolidityDebugSession {
  public execProtectedLaunchRequest() {
    const mockArgs = { txHash: "", workingDirectory: "", files: [], providerUrl: "" };
    return this.launchRequest(baseDebugAdapterResponseMock, mockArgs);
  }

  public execProtectedSetBreakPointsRequest() {
    const mockSetBreakPointsResponse = { body: { breakpoints: [] }, ...baseDebugAdapterResponseMock };
    const mockArgs = { source: {} };
    return this.setBreakPointsRequest(mockSetBreakPointsResponse, mockArgs);
  }

  public execProtectedThreadRequest() {
    const mockThreadsResponse = { body: { threads: [] }, ...baseDebugAdapterResponseMock };
    return this.threadsRequest(mockThreadsResponse);
  }

  public execProtectedStackTraceRequest() {
    const mockStackTraceResponse = { body: { stackFrames: [] }, ...baseDebugAdapterResponseMock };
    return this.stackTraceRequest(mockStackTraceResponse);
  }

  public execProtectedCustomRequest(command: string) {
    return this.customRequest(command, baseDebugAdapterResponseMock);
  }
}
