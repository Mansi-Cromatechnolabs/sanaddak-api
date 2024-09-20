module.exports = {
  async up(db, client) {
    await db.createCollection('supports');
  },

  async down(db, client) {
    await db.collection('supports').drop();
  }
};
