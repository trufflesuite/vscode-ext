import assert from "assert";
import {platform} from "os";
import * as helpers from "../../src/debugAdapter/helpers";

describe("helpers unit tests", () => {
  it("groupBy should return correct result", () => {
    const keyValue1 = "1";
    const keyValue2 = "2";
    const elA = {a: keyValue1, b: 1};
    const elB = {a: keyValue1, b: 2};
    const elC = {a: keyValue2, b: 3};
    const arrayMock = [elA, elB, elC];
    const groups = helpers.groupBy(arrayMock, "a");

    assert.strictEqual(Object.keys(groups).length, 2, "groups should be 2");
    assert.strictEqual(Object.keys(groups).includes(keyValue1), true, `groups should contain key ${keyValue1}`);
    assert.strictEqual(Object.keys(groups).includes(keyValue2), true, `groups should contain key ${keyValue2}`);
    assert.strictEqual(groups[keyValue1][0], elA, "group 1 should contain elA");
    assert.strictEqual(groups[keyValue1][1], elB, "group 1 should contain elB");
    assert.strictEqual(groups[keyValue2][0], elC, "group 2 should contain elC");
  });

  if (platform() === "win32") {
    getTestCasesForSortFilePathsOnWindows().forEach((testCase) => {
      sortFilePathTest(testCase.input, testCase.output);
    });
  } else {
    getTestCasesForSortFilePathsOnUnix().forEach((testCase) => {
      sortFilePathTest(testCase.input, testCase.output);
    });
  }

  function sortFilePathTest(input: string[], output: string[]) {
    it("sortFilePaths should return correct result", () => {
      const result = helpers.sortFilePaths(input);
      output.forEach((element, index) => {
        assert.strictEqual(result[index], element, `${index}-th element should equal ${element}`);
      });
    });
  }

  function getTestCasesForSortFilePathsOnWindows() {
    return [
      {
        input: ["A:\\B\\C\\b.ext", "A:/B/C/D/a.ext", "A:/B/C/a.ext"],
        output: ["A:/B/C/a.ext", "A:\\B\\C\\b.ext", "A:/B/C/D/a.ext"],
      },
      {
        input: ["A:/B/C/E/a.ext", "A:/B/C/b.ext", "A:/B/C/E/F/a.ext", "A:\\B\\C\\a.ext", "A:\\B\\C\\D\\A\\B\\b.ext"],
        output: ["A:\\B\\C\\a.ext", "A:/B/C/b.ext", "A:\\B\\C\\D\\A\\B\\b.ext", "A:/B/C/E/a.ext", "A:/B/C/E/F/a.ext"],
      },
    ];
  }

  function getTestCasesForSortFilePathsOnUnix() {
    return [
      {
        input: ["A:/B/C/b.ext", "A:/B/C/D/a.ext", "A:/B/C/a.ext"],
        output: ["A:/B/C/a.ext", "A:/B/C/b.ext", "A:/B/C/D/a.ext"],
      },
      {
        input: ["A:/B/C/E/a.ext", "A:/B/C/b.ext", "A:/B/C/E/F/a.ext", "A:/B/C/a.ext", "A:/B/C/D/A/B/b.ext"],
        output: ["A:/B/C/a.ext", "A:/B/C/b.ext", "A:/B/C/D/A/B/b.ext", "A:/B/C/E/a.ext", "A:/B/C/E/F/a.ext"],
      },
    ];
  }
});
