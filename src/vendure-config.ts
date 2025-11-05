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
const serverPort = +process.env.PORT || 3000;

export const config: VendureConfig = {
  apiOptions: {
    port: serverPort,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    hostname: '0.0.0.0',
    trustProxy: IS_DEV ? false : 1,
  },

  authOptions: {
    tokenMethod: 'cookie',
    superadminCredentials: {
      identifier: 'superadmin',
      password: 'superadmin',
    },
  },

  dbConnectionOptions: {
    type: 'sqlite',
    synchronize: true,
    logging: false,
    database: path.join(__dirname, '../vendure.sqlite'),
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

    // 🔍 Elasticsearch como motor de busca
    ElasticsearchPlugin.init({
      indexPrefix: 'carsandvibes',
      clientOptions: {
        node: process.env.ELASTIC_NODE ?? 'http://127.0.0.1:9200',
      },
    }),

    // 📧 Email em modo de desenvolvimento
    EmailPlugin.init({
      devMode: true,
      route: 'mailbox',
      outputPath: path.join(__dirname, '../static/email/test-emails'),
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(
        path.join(__dirname, '../static/email/templates')
      ),
    }),

    // 🧭 Admin UI
    AdminUiPlugin.init({
      route: 'admin',
      port: 3002,
    }),
  ],
};
