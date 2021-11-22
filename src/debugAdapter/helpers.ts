// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import { relative as pathRelative, sep as pathSep } from "path";

export function sortFilePaths(filePaths: string[]): string[] {
  return filePaths.sort(comparePaths);
}

// Compare 2 paths: pathA and pathB
// return -1 if pathA < pathB,
//         1 if pathA > pathB,
//         0 if pathA = pathB,
function comparePaths(pathA: string, pathB: string): number {
  function pathDiffContainsFolders(pathDiff: string) {
    return pathDiff.indexOf(pathSep) !== -1;
  }

  const pathAdiffByPathB = getPathsDiff(pathA, pathB);
  const pathBdiffByPathA = getPathsDiff(pathB, pathA);
  const isPathAdiffByPathBContainsFolder = pathDiffContainsFolders(pathAdiffByPathB);
  const isPathBdiffByPathBContainsFolder = pathDiffContainsFolders(pathBdiffByPathA);
  if (!isPathAdiffByPathBContainsFolder && isPathBdiffByPathBContainsFolder) {
    return -1;
  } else if (isPathAdiffByPathBContainsFolder && !isPathBdiffByPathBContainsFolder) {
    return 1;
  } else {
    return pathAdiffByPathB < pathBdiffByPathA ? -1 : pathAdiffByPathB > pathBdiffByPathA ? 1 : 0;
  }
}

function getPathsDiff(source: string, diffBy: string) {
  const relativeArray = pathRelative(diffBy, source).split(`..${pathSep}`);
  return relativeArray[relativeArray.length - 1];
}

export function groupBy(array: any[], key: any) {
  const groupedArray = array.reduce((acc, curr) => {
    (acc[curr[key]] = acc[curr[key]] || []).push(curr);

    return acc;
  }, {});

  return groupedArray;
}
