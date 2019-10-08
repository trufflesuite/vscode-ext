
import { SolidityDebugSession } from '../../src/debugAdapter/debugSession';

const baseDebugAdapterResponseMock = { request_seq: 1, success: true, command: '', seq: 1, type: '' };

export class SolidityDebugSessionClient extends SolidityDebugSession {
  public execProtectedLaunchRequest() {
    const mockArgs = { txHash: '', workingDirectory: '', files: [], providerUrl: '' };
    return this.launchRequest(baseDebugAdapterResponseMock, mockArgs);
  }

  public execProtectedSetBreakPointsRequest() {
    const mockLaunchResponse = { body: { breakpoints: [] } , ...baseDebugAdapterResponseMock };
    const mockArgs = { source: {} };
    return this.setBreakPointsRequest(mockLaunchResponse, mockArgs);
  }

  public execProtectedThreadRequest() {
      const mockLaunchResponse = { body: { threads: [] } , ...baseDebugAdapterResponseMock };
      return this.threadsRequest(mockLaunchResponse);
  }

  public execProtectedStackTraceRequest() {
      const mockLaunchResponse = { body: { stackFrames: [] } , ...baseDebugAdapterResponseMock };
      return this.stackTraceRequest(mockLaunchResponse);
  }

  public execProtectedCustomRequest(command: string) {
    return this.customRequest(command, baseDebugAdapterResponseMock);
  }
}
