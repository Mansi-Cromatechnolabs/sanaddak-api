module.exports = {
  async up(db, client) {
    await db.createCollection('globalconfigs');
  },

  async down(db, client) {
    await db.collection('globalconfigs').drop();
  }
};
