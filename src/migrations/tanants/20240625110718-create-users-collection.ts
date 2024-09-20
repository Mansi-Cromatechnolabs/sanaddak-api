module.exports = {
  async up(db, client) {
    await db.createCollection('Staff');
  },

  async down(db, client) {
    await db.collection('Staff').drop();
  }
};
