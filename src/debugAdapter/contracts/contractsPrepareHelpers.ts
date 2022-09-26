// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import Compiler from '@truffle/workflow-compile';
import Config from '@truffle/config';
import { Compilations } from '@truffle/codec';
import path from 'path';
import { Source } from '@truffle/compile-common';

export type ContractData = {
  provider: any;
  sources: Map<string, string>;
  compilations: Array<Compilations.Compilation>;
};

export async function prepareContracts(workingDirectory: any, providerUrl: string): Promise<ContractData> {
  const config = Config.detect({ workingDirectory: workingDirectory });
  config.all = true;
  config.quiet = true;

  const { compilations } = await Compiler.compile(config);
  const shimCompilations = Compilations.Utils.shimCompilations(compilations);

  const sources = new Map<string, string>();

  await Promise.all(
    Object.values(compilations[0].sources).map(async (source) => {
      const absolutePath = await getSourcePath(workingDirectory, source);
      sources.set(source.sourcePath, absolutePath);
    })
  );

  return {
    provider: providerUrl,
    sources,
    compilations: shimCompilations,
  };
}

async function getSourcePath(workingDirectory: string, source: Source): Promise<string> {
  const absolutePathKey = 'absolutePath' as keyof typeof source.ast;
  const absolutePathValue = source.ast![absolutePathKey] as string;

  if (absolutePathValue.startsWith('project:/')) return source.sourcePath;
  else return path.join(workingDirectory, 'node_modules', absolutePathValue);
}
