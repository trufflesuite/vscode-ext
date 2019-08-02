// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const copy = (text) => {
  const span = document.createElement('span');
  span.textContent = text;
  span.style.whiteSpace = 'pre';

  document.body.appendChild(span);

  const selection = window.getSelection();
  const range = document.createRange();

  selection.removeAllRanges();
  range.selectNode(span);
  selection.addRange(range);

  document.execCommand('copy');

  selection.removeAllRanges();

  document.body.removeChild(span);
};
