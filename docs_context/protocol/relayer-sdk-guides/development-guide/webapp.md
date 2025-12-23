# Source: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp

Copy

# Web applications

This document guides you through building a web application using the `@zama-fhe/relayer-sdk` library.

## Using directly the library

### Step 1: Setup the library

`@zama-fhe/relayer-sdk` consists of multiple files, including WASM files and WebWorkers, which can make packaging these components correctly in your setup cumbersome. To simplify this process, especially if you're developing a dApp with server-side rendering (SSR), we recommend using our CDN.

#### Using UMD CDN

The Zama CDN url format is `https://cdn.zama.org/relayer-sdk-js/<package-version>/relayer-sdk-js.umd.cjs`

Include this line at the top of your project.

Copy

```bash
<script
  src="https://cdn.zama.org/relayer-sdk-js/0.3.0-8/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
```

In your project, you can use the bundle import if you install `@zama-fhe/relayer-sdk` package:

Copy

```bash
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';
```

#### Using ESM CDN

If you prefer You can also use the `@zama-fhe/relayer-sdk` as a ES module:

#### Using npm package

Install the `@zama-fhe/relayer-sdk` library to your project:

`@zama-fhe/relayer-sdk` uses ESM format. You need to set the [type to "module" in your package.json](https://nodejs.org/api/packages.html#type). If your node project use `"type": "commonjs"` or no type, you can force the loading of the web version by using `import { createInstance } from '@zama-fhe/relayer-sdk/web';`

### Step 2: Initialize your project

To use the library in your project, you need to load the WASM of [TFHE](https://www.npmjs.com/package/tfhe) first with `initSDK`.

### Step 3: Create an instance

Once the WASM is loaded, you can now create an instance.

You can now use your instance to [encrypt parameters](/protocol/relayer-sdk-guides/fhevm-relayer/input), perform [user decryptions](/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption) or [public decryptions](/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption).

[PreviousPublic decryption](/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption)[NextDebugging](/protocol/relayer-sdk-guides/development-guide/webpack)

Last updated 3 days ago