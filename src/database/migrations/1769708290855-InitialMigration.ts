import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1769708290855 implements MigrationInterface {
    name = 'InitialMigration1769708290855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "portfolio_holdings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "portfolioId" uuid NOT NULL, "cryptoId" uuid NOT NULL, "quantity" numeric(20,8) NOT NULL DEFAULT '0', "averageBuyPrice" numeric(20,2) NOT NULL DEFAULT '0', "totalCost" numeric(20,2) NOT NULL DEFAULT '0', "currentValue" numeric(20,2) NOT NULL DEFAULT '0', "profitLoss" numeric(20,2) NOT NULL DEFAULT '0', "profitLossPercentage" numeric(10,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b0c626396de7d779e40320eda91" UNIQUE ("portfolioId", "cryptoId"), CONSTRAINT "PK_791e8293470395842404d51142f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b0c626396de7d779e40320eda9" ON "portfolio_holdings" ("portfolioId", "cryptoId") `);
        await queryRunner.query(`CREATE TYPE "public"."alerts_condition_enum" AS ENUM('ABOVE', 'BELOW')`);
        await queryRunner.query(`CREATE TYPE "public"."alerts_status_enum" AS ENUM('ACTIVE', 'TRIGGERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "cryptoId" uuid NOT NULL, "condition" "public"."alerts_condition_enum" NOT NULL, "targetPrice" numeric(20,8) NOT NULL, "status" "public"."alerts_status_enum" NOT NULL DEFAULT 'ACTIVE', "message" text, "triggeredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b63189bf8e5abf5b9188acca96" ON "alerts" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_91a37295a239f46327dcabc3ff" ON "alerts" ("cryptoId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_d8d268f3cadee3c634dffeed65" ON "alerts" ("userId", "status") `);
        await queryRunner.query(`CREATE TABLE "price_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cryptoId" uuid NOT NULL, "price" numeric(20,8) NOT NULL, "marketCap" bigint NOT NULL, "volume" bigint NOT NULL, "timestamp" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e41e25472373d4b574b153229e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_289db4cdf9022df4eafc0a09cf" ON "price_history" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_b0767a64468a5277c38ebe324c" ON "price_history" ("cryptoId", "timestamp") `);
        await queryRunner.query(`CREATE TABLE "cryptocurrencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coinGeckoId" character varying(50) NOT NULL, "symbol" character varying(10) NOT NULL, "name" character varying(100) NOT NULL, "image" text, "currentPrice" numeric(20,8) NOT NULL DEFAULT '0', "marketCap" bigint NOT NULL DEFAULT '0', "marketCapRank" integer, "totalVolume" bigint NOT NULL DEFAULT '0', "priceChange24h" numeric(10,2) NOT NULL DEFAULT '0', "priceChangePercentage24h" numeric(10,2) NOT NULL DEFAULT '0', "priceChangePercentage7d" numeric(10,2) NOT NULL DEFAULT '0', "priceChangePercentage30d" numeric(10,2) NOT NULL DEFAULT '0', "ath" numeric(20,8), "athDate" TIMESTAMP, "atl" numeric(20,8), "atlDate" TIMESTAMP, "lastUpdated" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6dc70a6ff1cfabd5ca589aafe14" UNIQUE ("coinGeckoId"), CONSTRAINT "UQ_b386e8f2645be5e449db0702f4e" UNIQUE ("symbol"), CONSTRAINT "PK_0f2b78d1269742490d44fcfbe8a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6dc70a6ff1cfabd5ca589aafe1" ON "cryptocurrencies" ("coinGeckoId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b386e8f2645be5e449db0702f4" ON "cryptocurrencies" ("symbol") `);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('BUY', 'SELL')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transactions_type_enum" NOT NULL, "portfolioId" uuid NOT NULL, "cryptoId" uuid NOT NULL, "quantity" numeric(20,8) NOT NULL, "pricePerUnit" numeric(20,2) NOT NULL, "totalAmount" numeric(20,2) NOT NULL, "feeAmount" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "transactionDate" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_65a91cee6272cc0da149807869" ON "transactions" ("transactionDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_d123a03d2848212b14e7a68789" ON "transactions" ("cryptoId", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_4dd43ecd0ef16d7f53a4996d39" ON "transactions" ("portfolioId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "totalValue" numeric(20,2) NOT NULL DEFAULT '0', "totalCost" numeric(20,2) NOT NULL DEFAULT '0', "totalProfitLoss" numeric(10,2) NOT NULL DEFAULT '0', "totalProfitLossPercentage" numeric(10,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e4e66691a2634fcf5525e33ecf" ON "portfolios" ("userId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(100) NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "password" character varying NOT NULL, "refreshToken" character varying, "isActive" boolean NOT NULL DEFAULT true, "emailVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "FK_65b5e59d80a8a0fd9044c1ea32c" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "FK_2f36803a88579b54e3b1dea5932" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_f2678f7b11e5128abbbc4511906" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_5b1c58beed97de5d6d376019fd0" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD CONSTRAINT "FK_015e63fbf23e87907a593577711" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_3682c52dea5cc662b3d9b00a74b" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_36372117dcc63807e900764e8b8" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolios" ADD CONSTRAINT "FK_e4e66691a2634fcf5525e33ecf5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolios" DROP CONSTRAINT "FK_e4e66691a2634fcf5525e33ecf5"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_36372117dcc63807e900764e8b8"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_3682c52dea5cc662b3d9b00a74b"`);
        await queryRunner.query(`ALTER TABLE "price_history" DROP CONSTRAINT "FK_015e63fbf23e87907a593577711"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_5b1c58beed97de5d6d376019fd0"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_f2678f7b11e5128abbbc4511906"`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "FK_2f36803a88579b54e3b1dea5932"`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "FK_65b5e59d80a8a0fd9044c1ea32c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4e66691a2634fcf5525e33ecf"`);
        await queryRunner.query(`DROP TABLE "portfolios"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4dd43ecd0ef16d7f53a4996d39"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d123a03d2848212b14e7a68789"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65a91cee6272cc0da149807869"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b386e8f2645be5e449db0702f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6dc70a6ff1cfabd5ca589aafe1"`);
        await queryRunner.query(`DROP TABLE "cryptocurrencies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0767a64468a5277c38ebe324c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_289db4cdf9022df4eafc0a09cf"`);
        await queryRunner.query(`DROP TABLE "price_history"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d8d268f3cadee3c634dffeed65"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91a37295a239f46327dcabc3ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b63189bf8e5abf5b9188acca96"`);
        await queryRunner.query(`DROP TABLE "alerts"`);
        await queryRunner.query(`DROP TYPE "public"."alerts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alerts_condition_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0c626396de7d779e40320eda9"`);
        await queryRunner.query(`DROP TABLE "portfolio_holdings"`);
    }

}
