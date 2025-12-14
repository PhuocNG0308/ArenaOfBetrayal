/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Fix for "global is not defined" in @zama-fhe/relayer-sdk
    config.plugins.push(
      new webpack.DefinePlugin({
        global: 'globalThis',
      })
    );

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
