import dataSource from '../../config/typeorm.config';
import { seedCryptocurrencies } from './cryptocurrency.seeder';

async function runSeeders() {
  try {
    console.log('Initializing data source...');
    await dataSource.initialize();
    console.log('Data source initialized successfully!');

    console.log('\n--- Running Seeders ---\n');

    await seedCryptocurrencies(dataSource);

    console.log('\n--- All Seeders Completed ---\n');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error running seeders:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeeders();
