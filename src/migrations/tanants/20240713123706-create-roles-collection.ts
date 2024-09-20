module.exports = {
  async up(db, client) {
    await db.createCollection('roles');
    await db.collection('roles').createIndex({ name: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('roles').drop();
  }
};
