// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import BooleanInput from './BooleanInput';
import TextInput from './TextInput';

const InputComponentMapping = {
  address: TextInput,
  string: TextInput,
  uint: TextInput,
  bool: BooleanInput,
};

export default InputComponentMapping;
