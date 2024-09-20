module.exports = {
    async up(db, client) {
      await db.createCollection('tanants');
      await db.collection('tanants').createIndex({ db_name: 1 }, { unique: true });
      await db.collection('tanants').createIndex({ subdomain: 1 }, { unique: true });
    },
  
    async down(db, client) {
      await db.collection('tanants').drop();
    }
  };
  