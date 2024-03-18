// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { printSuppressHelp } from './utils/print-help';
import { runEslintAsync } from './runEslint';

interface IParsedArgs {
  rules: string[];
  all: boolean;
  files: string[];
}

export async function suppressAsync(): Promise<void> {
  const args: string[] = process.argv.slice(3);

  if (args.includes('--help') || args.includes('-h')) {
    printSuppressHelp();
    process.exit(0);
  }

  // Use reduce to create an object with all the parsed arguments
  const parsedArgs: IParsedArgs = args.reduce<{
    rules: string[];
    all: boolean;
    files: string[];
  }>(
    (acc, arg, index, arr) => {
      if (arg === '--rule') {
        // continue because next arg should be the rule
      } else if (index > 0 && arr[index - 1] === '--rule' && arr[index + 1]) {
        acc.rules.push(arg);
      } else if (arg === '--all') {
        acc.all = true;
      } else if (arg.startsWith('--')) {
        throw new Error(`@rushstack/eslint-bulk: Unknown option: ${arg}`);
      } else {
        acc.files.push(arg);
      }
      return acc;
    },
    { rules: [], all: false, files: [] }
  );

  if (parsedArgs.files.length === 0) {
    throw new Error(
      '@rushstack/eslint-bulk: Files argument is required. Use glob patterns to specify files or use ' +
        '`.` to suppress all files for the specified rules.'
    );
  }

  if (parsedArgs.rules.length === 0 && !parsedArgs.all) {
    throw new Error(
      '@rushstack/eslint-bulk: Please specify at least one rule to suppress. Use --all to suppress all rules.'
    );
  }

  // Find the index of the last argument that starts with '--'
  const lastOptionIndex: number = args
    .map((arg, i) => (arg.startsWith('--') ? i : -1))
    .reduce((lastIndex, currentIndex) => Math.max(lastIndex, currentIndex), -1);

  // Check if options come before files
  if (parsedArgs.files.some((file) => args.indexOf(file) < lastOptionIndex)) {
    throw new Error(
      '@rushstack/eslint-bulk: Unable to parse command line arguments. All options should come before files argument.'
    );
  }

  if (parsedArgs.all) {
    process.env.ESLINT_BULK_SUPPRESS = '*';
  } else if (parsedArgs.rules.length > 0) {
    process.env.ESLINT_BULK_SUPPRESS = parsedArgs.rules.join(',');
  }

  await runEslintAsync(parsedArgs.files, 'suppress');

  if (parsedArgs.all) {
    console.log(`@rushstack/eslint-bulk: Successfully suppressed all rules for file(s) ${parsedArgs.files}`);
  } else if (parsedArgs.rules.length > 0) {
    console.log(
      `@rushstack/eslint-bulk: Successfully suppressed rules ${parsedArgs.rules} for file(s) ${parsedArgs.files}`
    );
  }
}
