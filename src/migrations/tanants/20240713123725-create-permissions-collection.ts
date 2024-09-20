module.exports = {
  async up(db, client) {
    await db.createCollection('permissions');
    await db.collection('permissions').createIndex({ name: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('permissions').drop();
  }
};
