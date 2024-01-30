export default (): any => ({
  env: process.env.NODE_ENV,
  port: process.env.PAYMENT_APP_PORT,
  defaultLanguage: process.env.DEFAULT_LANGUAGE,
  corsWhitelist: process.env.CORS_WHITELIST,

  database: {
    host: process.env.PAYMENT_DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    name: process.env.PAYMENT_DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },

  paymentGrpc: {
    host: '0.0.0.0',
    port: process.env.PAYMENT_GRPC_SERVER_PORT,
  },

  transactionGrpc: {
    host: process.env.ORDER_PAYMENT_ENGINE_GRPC_SERVER_HOST,
    port: process.env.ORDER_PAYMENT_ENGINE_GRPC_SERVER_PORT,
  },

  walletEndpoint: process.env.WALLET_ENDPOINT,
  bnplWalletEndpoint: process.env.BNPL_WALLET_ENDPOINT,
  userEndpoint: process.env.USER_ENDPOINT,
  callerEndpoints: {
    opeEndpoint: process.env.OPE_ENDPOINT,
  },

  eefaEndpoint: process.env.EEFA_ENDPOINT,
  eefaCreds: {
    username: process.env.EEFA_USER,
    password: process.env.EEFA_PASS,
  },

  walletGrpc: {
    host: process.env.WALLET_GRPC_SERVER_HOST,
    port: process.env.WALLET_GRPC_SERVER_PORT,
  },

  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    accessTokenExpiresInSec: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY_IN_SEC, 10),
  },
});
