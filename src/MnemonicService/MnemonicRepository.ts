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

  public static getExistedMnemonicPaths(): string[] {
    return MnemonicRepository.getAllMnemonicPaths().filter((path) => fs.existsSync(path));
  }

  public static saveMnemonicPath(filePath: string): void {
    const storage = MnemonicRepository.globalState.get(Constants.mnemonicConstants.mnemonicStorage) as string[] || [];
    storage.push(filePath);
    MnemonicRepository.globalState.update(Constants.mnemonicConstants.mnemonicStorage, storage);
  }

  public static MaskMnemonic(mnemonic: string) {
    return mnemonic
      ? `${mnemonic.slice(0, 3)} ... ${mnemonic.slice(-3)}`
      : Constants.placeholders.emptyLineText;
  }

  private static globalState: Memento;
}
