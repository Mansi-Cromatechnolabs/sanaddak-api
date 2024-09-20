module.exports = {
    async up(db, client) {
      await db.createCollection('settings');
      await db.collection('settings').createIndex({ key: 1 }, { unique: true });
    },
  
    async down(db, client) {
      await db.collection('settings').drop();
    }
  };
  