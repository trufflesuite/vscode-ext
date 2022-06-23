// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {expect} from "chai";
import * as clipboard from "clipboardy";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import {
  ActivityBar,
  BottomBarPanel,
  CustomTreeSection,
  DefaultTreeSection,
  DialogHandler,
  InputBox,
  OutputView,
  SideBarView,
  TreeItem,
  VSBrowser,
  WebDriver,
  Workbench,
} from "vscode-extension-tester";
import {commonTestTimeout, setupTimeout, testProjectDirectory} from "./config";

const tempProjectPrefix = "ui-test-";

describe("Truffle tests", function () {
  this.timeout(setupTimeout);
  let driver: WebDriver;
  let workbench: Workbench;
  let testDir: string;

  before(async () => {
    testDir = testProjectDirectory || createTempFolder();
    driver = VSBrowser.instance.driver;
    await driver.manage().timeouts().implicitlyWait(30000);
    await driver.manage().timeouts().setScriptTimeout(30000);
    await driver.manage().timeouts().pageLoadTimeout(30000);

    workbench = new Workbench();

    await createNewSolidityProject(driver, workbench, testDir);
  });

  after(async () => {
    await openWorkspace(workbench, os.tmpdir());
    await reload(workbench);
    await removeTempFolder(testDir);
  });

  describe("Truffle tests", () => {
    it("Create new network", async () => {
      const testNetworkName = "testnetwork";

      await workbench.executeCommand("AzureBlockchain: Create a new network");
      const serviceTypeInput = await driver.wait(() => new InputBox(), 5000);
      await serviceTypeInput.setText("Local Service");
      await serviceTypeInput.confirm();

      const networkNameInput = await driver.wait(() => new InputBox(), 5000);
      await networkNameInput.setText(testNetworkName);
      await networkNameInput.confirm();

      const networkPortInput = await driver.wait(() => new InputBox(), 5000);
      await networkPortInput.setText("8535");
      await networkPortInput.confirm();

      const azureBlockchainSection = <CustomTreeSection>(
        await new SideBarView().getContent().getSection("AzureBlockchain")
      );
      await azureBlockchainSection.expand();

      const localServiceSection = await azureBlockchainSection.findItem("Local Service");

      expect(localServiceSection).instanceOf(TreeItem);

      const localServices = await localServiceSection?.getChildren();
      const localServicesNames = localServices?.map((service) => service.getLabel());

      expect(localServicesNames?.includes(testNetworkName)).equals(true, "New network name should appear in the tree");
    }).timeout(commonTestTimeout);

    it("Build contracts", async () => {
      const output = await driver.wait(() => new BottomBarPanel().openOutputView(), 5000);
      await output.selectChannel("AzureBlockchain");
      await output.clearText();

      await workbench.executeCommand("AzureBlockchain: Build Contracts");

      await scanOutput(driver, output, "Compiled successfully using", 60000, 2000, 5000);

      const directoryFiles = fs.readdirSync(path.join(testDir, "build", "contracts"));

      expect(directoryFiles.length).not.equals(0);
    }).timeout(commonTestTimeout);

    it("Deploy contracts", async () => {
      const output = await driver.wait(() => new BottomBarPanel().openOutputView(), 5000);
      await output.selectChannel("AzureBlockchain");
      await output.clearText();

      await workbench.executeCommand("AzureBlockchain: Deploy Contracts");

      const destinationInput = await driver.wait(() => new InputBox(), 60000);
      await destinationInput.setText("loc_testnetwork_testnetwork");
      await destinationInput.confirm();

      await scanOutput(driver, output, "Deploy succeeded", 60000, 2000, 5000);
    }).timeout(commonTestTimeout);

    describe("Abi and bytecode tests", () => {
      let buildContract: string;
      let contract: TreeItem | undefined;

      before(async () => {
        const workspaceSection = <DefaultTreeSection>(
          await new SideBarView().getContent().getSection("Untitled (Workspace)")
        );
        const projectName = testDir.match(new RegExp(`(${tempProjectPrefix}).*$`))![0];
        const project = await workspaceSection.findItem(projectName);
        await project?.click();

        const buildFolder = await project?.findChildItem("build");
        await buildFolder?.click();

        contract = await workspaceSection.findItem("HelloBlockchain.json");
        await contract?.select();

        buildContract = fs.readFileSync(path.join(testDir, "build", "contracts", "HelloBlockchain.json")).toString();
      });

      it("Copy Contract ABI command should be executed", async () => {
        const menu = await contract?.openContextMenu();
        const menuItem = await menu?.getItem("Copy Contract ABI");
        await menuItem?.select();
        await driver.sleep(1000);

        const abiBuffer = clipboard.readSync();

        expect(JSON.stringify(JSON.parse(buildContract)["abi"])).equals(abiBuffer);
      }).timeout(commonTestTimeout);

      it("Copy Transaction Bytecode command should be executed", async () => {
        const menu = await contract?.openContextMenu();
        const menuItem = await menu?.getItem("Copy Transaction Bytecode");
        await menuItem?.select();

        const destinationInput = await driver.wait(() => new InputBox(), 60000);
        await destinationInput.setText("loc_testnetwork_testnetwork");
        await destinationInput.confirm();

        const notifications = await new Workbench().getNotifications();
        const notification = notifications[0];

        const message = await notification.getMessage();

        const deployedBytecode = clipboard.readSync();

        expect(message.includes("Transaction Bytecode was copied to clipboard")).equals(
          true,
          "Notification should appear"
        );
        expect(deployedBytecode).not.equals(undefined, "Bytecode should be copied to clipboard");
      }).timeout(commonTestTimeout);

      it("Copy Constructor Bytecode command should be executed", async () => {
        const menu = await contract?.openContextMenu();
        const menuItem = await menu?.getItem("Copy Constructor Bytecode");
        await menuItem?.select();
        await driver.sleep(1000);

        const bytecode = clipboard.readSync();

        expect(JSON.parse(buildContract)["bytecode"]).equals(bytecode);
      }).timeout(commonTestTimeout);
    });
  });
});

async function scanOutput(
  driver: WebDriver,
  output: OutputView,
  successMessage: string,
  maxWait: number,
  timeout: number,
  initialWait: number
) {
  return driver.wait(async () => {
    return new Promise((resolve, reject) => {
      setTimeout(async function waiter() {
        try {
          const text = await output.getText();
          if (text.includes(successMessage)) {
            return resolve("Done");
          }
        } catch (error) {
          reject(error);
        }

        setTimeout(waiter, timeout);
      }, initialWait);
    });
  }, maxWait);
}

function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), tempProjectPrefix));
}

async function removeTempFolder(directory: string) {
  await fs.remove(directory);
}

async function openWorkspace(workbench: Workbench, directory: string): Promise<void> {
  await workbench.executeCommand("Extest: Open Folder");
  const input = await InputBox.create();
  await input.setText(directory);
  await input.confirm();
}

async function reload(workbench: Workbench) {
  await workbench.executeCommand("Developer: Reload Window");
}

async function createNewSolidityProject(driver: WebDriver, workbench: Workbench, testDirectory: string): Promise<void> {
  // we should close all previous notification because they can affect command execution
  // notification center work very slow
  const notificationCenter = await driver.wait(() => workbench.openNotificationsCenter(), 30000);
  await notificationCenter.clearAllNotifications();
  const activityBar = new ActivityBar();
  const explorer = await activityBar.getViewControl("Explorer");
  await explorer.openView();

  await workbench.executeCommand("AzureBlockchain: New Solidity Project");
  const input = await driver.wait(() => new InputBox(), 60000);
  await input.setText("Create basic project");
  await input.confirm();

  const dialog = await driver.wait(() => DialogHandler.getOpenDialog(), 5000);
  await dialog.selectPath(testDirectory);
  await dialog.confirm();

  const output = await driver.wait(() => new BottomBarPanel().openOutputView(), 5000);
  await output.selectChannel("AzureBlockchain");

  await driver.wait(async () => {
    return new Promise((resolve, reject) => {
      setTimeout(async function waitForUnboxing() {
        try {
          const text = await output.getText();

          if (text.includes("Error")) {
            return reject(new Error("Error on unboxing"));
          }

          if (
            fs.existsSync(path.join(testDirectory, "package-lock.json")) ||
            text.includes("Initialized empty Git repository")
          ) {
            return resolve("Done");
          }
        } catch (error) {
          reject(error);
        }

        setTimeout(waitForUnboxing, 3000);
      }, 20000);
    });
  }, 120000);

  // wait for change directory during project creation
  await driver.sleep(10000);
}
