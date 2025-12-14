---
applyTo: '**'
---
# Web applications

This document guides you through building a web application using the `@zama-fhe/relayer-sdk` library.

## Using directly the library

### Step 1: Setup the library

`@zama-fhe/relayer-sdk` consists of multiple files, including WASM files and WebWorkers, which can make packaging these components correctly in your setup cumbersome. To simplify this process, especially if you're developing a dApp with server-side rendering (SSR), we recommend using our CDN.

#### Using UMD CDN

The Zama CDN url format is `https://cdn.zama.org/relayer-sdk-js/<package-version>/relayer-sdk-js.umd.cjs`

Include this line at the top of your project.

```html
<script
  src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
```

In your project, you can use the bundle import if you install `@zama-fhe/relayer-sdk` package:

```javascript
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';
```

#### Using ESM CDN

If you prefer You can also use the `@zama-fhe/relayer-sdk` as a ES module:

```html
<script type="module">
  import {
    initSDK,
    createInstance,
    SepoliaConfig,
  } from 'https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs';

  await initSDK();
  const config = { ...SepoliaConfig, network: window.ethereum };
  config.network = window.ethereum;
  const instance = await createInstance(config);
</script>
```

#### Using npm package

Install the `@zama-fhe/relayer-sdk` library to your project:

```bash
# Using npm
npm install @zama-fhe/relayer-sdk

# Using Yarn
yarn add @zama-fhe/relayer-sdk

# Using pnpm
pnpm add @zama-fhe/relayer-sdk
```

`@zama-fhe/relayer-sdk` uses ESM format. You need to set the [type to "module" in your package.json](https://nodejs.org/api/packages.html#type). If your node project use `"type": "commonjs"` or no type, you can force the loading of the web version by using `import { createInstance } from '@zama-fhe/relayer-sdk/web';`

```javascript
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';
```

### Step 2: Initialize your project

To use the library in your project, you need to load the WASM of [TFHE](https://www.npmjs.com/package/tfhe) first with `initSDK`.

```javascript
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';

const init = async () => {
  await initSDK(); // Load needed WASM
};
```

### Step 3: Create an instance

Once the WASM is loaded, you can now create an instance.

```javascript
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';

const init = async () => {
  await initSDK(); // Load FHE
  const config = { ...SepoliaConfig, network: window.ethereum };
  return createInstance(config);
};

init().then((instance) => {
  console.log(instance);
});
```

You can now use your instance to [encrypt parameters](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input), perform [user decryptions](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption) or [public decryptions](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption).
