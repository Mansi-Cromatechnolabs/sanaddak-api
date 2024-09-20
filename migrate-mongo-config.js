require('dotenv').config();

module.exports = {
    mongodb: {
      url: process.env.MONGO_URL,
      databaseName: process.env.DB_NAME,
      options: {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      },
    },
    migrationsDir: 'src/migrations',
    changelogCollectionName: 'migrations',
    migrationFileExtension: ".js",
    useFileHash: false,
    moduleSystem: 'commonjs',
  };