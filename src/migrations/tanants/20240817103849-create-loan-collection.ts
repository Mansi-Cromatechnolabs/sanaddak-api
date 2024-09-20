module.exports = {
  async up(db, client) {
    await db.createCollection('loans');
  },

  async down(db, client) {
    await db.collection('loans').drop();
  }
};
