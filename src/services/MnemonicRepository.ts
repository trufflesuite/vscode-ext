import fs from 'fs-extra';
import type {Memento} from 'vscode';
import {Constants} from '@/Constants';

class ExtensionMnemonicRepository {
  private globalState?: Memento;

  public initialize(globalState: Memento): void {
    this.globalState = globalState;
  }

  public getMnemonic(filePath: string): string {
    return fs.readFileSync(filePath).toString().trim();
  }

  public getAllMnemonicPaths(): string[] {
    if (this.globalState) {
      return this.globalState.get(Constants.globalStateKeys.mnemonicStorageKey, []) as string[];
    }

    return [];
  }

  public getExistedMnemonicPaths(): string[] {
    return this.getAllMnemonicPaths().filter((path) => fs.existsSync(path));
  }

  public saveMnemonicPath(filePath: string): void {
    if (this.globalState) {
      const storage = (this.globalState.get(Constants.globalStateKeys.mnemonicStorageKey) as string[]) || [];
      this.globalState.update(Constants.globalStateKeys.mnemonicStorageKey, [...storage, filePath]);
    }
  }

  public MaskMnemonic(mnemonic: string) {
    return mnemonic ? `${mnemonic.slice(0, 3)} ... ${mnemonic.slice(-3)}` : Constants.placeholders.emptyLineText;
  }
}

export const MnemonicRepository = new ExtensionMnemonicRepository();
