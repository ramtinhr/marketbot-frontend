# Coin logos

Recognized coin artwork sourced from https://github.com/trustwallet/assets (master),
except TON from CoinGecko:

- BTC: blockchains/bitcoin/info/logo.png
- ETH: blockchains/ethereum/info/logo.png
- USDT: blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png
- TON: https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png
- SOL: blockchains/solana/info/logo.png

Resized to 96 × 96 pixels with transparency preserved and compressed to WebP
using sharp (quality 85, effort 6). Total payload: 9,858 bytes. These files are
served locally and already optimized; CoinLogo skips runtime recompression and
uses native lazy loading with asynchronous decoding. Artwork belongs to its
respective owner.
