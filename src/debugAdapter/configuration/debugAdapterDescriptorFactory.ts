import {
    DebugAdapterDescriptor,
    DebugAdapterDescriptorFactory,
    DebugAdapterExecutable,
    DebugAdapterServer,
    DebugSession,
    ProviderResult,
} from 'vscode';

import * as Net from 'net';
import { SolidityDebugSession } from '../debugSession';

export default class TruffleDebugAdapterDescriptorFactory implements DebugAdapterDescriptorFactory {
    private _server?: Net.Server;

    public createDebugAdapterDescriptor(
        _session: DebugSession,
        _executable: DebugAdapterExecutable | undefined): ProviderResult<DebugAdapterDescriptor> {

        if (!this._server) {
            // start listening on a random port
            this._server = Net.createServer((socket) => {
                const debugSession = new SolidityDebugSession();
                debugSession.setRunAsServer(true);
                debugSession.start(socket as NodeJS.ReadableStream, socket);
            }).listen(0);
        }

        // make VS Code connect to debug server
        const address: any = this._server.address();
        return new DebugAdapterServer(address.port);
    }

    public dispose() {
        if (this._server) {
            this._server.close();
        }
    }
}
