// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const maxLength = 4095;
const truffleConfig = require(process.argv[2]);

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (k, v) => {
    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) {
        return;
      }
      seen.add(v);
    }

    if (typeof v === 'function') {
      return v.toString();
    }

    return v;
  };
};

let message = JSON.stringify(truffleConfig, getCircularReplacer());

if (message.length > maxLength) {
  for (let i = 0; i < message.length; i++) {
    const index = Math.min(maxLength, message.length);
    const str = message.substr(0, index);
    message = message.substr(index);

    process.send({ command: 'truffleConfig', batch: { index: i, done: message.length === 0, message: str} });
  }
} else {
  process.send({ command: 'truffleConfig', message: message });
}

setTimeout(() => process.exit(), 1000);
