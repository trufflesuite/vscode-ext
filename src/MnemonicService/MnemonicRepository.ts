import * as fs from 'fs';
import { Memento } from 'vscode';
import { Constants } from '../Constants';

export class MnemonicRepository {

  public static initialize(globalState: Memento): void {
    MnemonicRepository.globalState = globalState;
  }

  public static getMnemonic(filePath: string): string {
    return fs.readFileSync(filePath).toString().trim();
  }

  public static getAllMnemonicPaths(): string[] {
    return MnemonicRepository.globalState.get(Constants.mnemonicConstants.mnemonicStorage) as string[] || [];
  }

  public static saveMnemonicPath(filePath: string): void {
    const storage = MnemonicRepository.globalState.get(Constants.mnemonicConstants.mnemonicStorage) as string[] || [];
    storage.push(filePath);
    MnemonicRepository.globalState.update(Constants.mnemonicConstants.mnemonicStorage, storage);
  }

  private static globalState: Memento;
}
