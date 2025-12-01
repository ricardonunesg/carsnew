import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  VendureConfig,
} from '@vendure/core';
import { ElasticsearchPlugin } from '@vendure/elasticsearch-plugin';
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import 'dotenv/config';
import path from 'path';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +(process.env.PORT || 3000);

export const config: VendureConfig = {
  apiOptions: {
    port: serverPort,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    hostname: '0.0.0.0',
    trustProxy: 1,
  },

  authOptions: {
    tokenMethod: 'cookie',
    superadminCredentials: {
      identifier: 'superadmin',
      password: 'superadmin',
    },
  },

  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'vendure_user',
    password: process.env.DB_PASSWORD || 'cars123',
    database: process.env.DB_NAME || 'vendure',
    synchronize: IS_DEV, // em dev true, em prod ideal é false + migrations
    logging: false,
  },

  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },

  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../static/assets'),
    }),

    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,

    ElasticsearchPlugin.init({
      indexPrefix: 'carsandvibes',
      clientOptions: {
        node: process.env.ELASTIC_NODE ?? 'http://127.0.0.1:9200',
      },
    }),

    EmailPlugin.init({
      devMode: true,
      route: 'mailbox',
      outputPath: path.join(__dirname, '../static/email/test-emails'),
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(
        path.join(__dirname, '../static/email/templates'),
      ),
    }),

    AdminUiPlugin.init({
      route: 'admin',
      port: serverPort,
    }),
  ],
};
