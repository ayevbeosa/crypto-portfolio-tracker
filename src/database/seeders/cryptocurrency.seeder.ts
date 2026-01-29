import { DataSource } from 'typeorm';
import { Cryptocurrency } from '../entities/cryptocurrency.entity';

export const seedCryptocurrencies = async (dataSource: DataSource) => {
  const cryptoRepository = dataSource.getRepository(Cryptocurrency);

  const cryptocurrencies = [
    {
      coinGeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    },
    {
      coinGeckoId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    },
    {
      coinGeckoId: 'binancecoin',
      symbol: 'BNB',
      name: 'BNB',
      image:
        'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    },
    {
      coinGeckoId: 'ripple',
      symbol: 'XRP',
      name: 'XRP',
      image:
        'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    },
    {
      coinGeckoId: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    },
    {
      coinGeckoId: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    },
    {
      coinGeckoId: 'dogecoin',
      symbol: 'DOGE',
      name: 'Dogecoin',
      image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    },
    {
      coinGeckoId: 'polkadot',
      symbol: 'DOT',
      name: 'Polkadot',
      image:
        'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    },
    {
      coinGeckoId: 'avalanche-2',
      symbol: 'AVAX',
      name: 'Avalanche',
      image:
        'https://assets.coingecko.com/coins/images/12559/large/avalanche_token_round.png',
    },
    {
      coinGeckoId: 'matic-network',
      symbol: 'MATIC',
      name: 'Polygon',
      image:
        'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    },
  ];

  for (const crypto of cryptocurrencies) {
    const exists = await cryptoRepository.findOne({
      where: { symbol: crypto.symbol },
    });

    if (!exists) {
      const newCrypto = cryptoRepository.create(crypto);
      await cryptoRepository.save(newCrypto);
      console.log(`Seeded: ${crypto.name} (${crypto.symbol})`);
    } else {
      console.log(
        `Skipped: ${crypto.name} (${crypto.symbol}) - already exists`,
      );
    }
  }

  console.log('Cryptocurrency seeding completed!');
};
