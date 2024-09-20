module.exports = {
  async up(db, client) {
    await db.createCollection('branches');
  },

  async down(db, client) {
    await db.collection('branches').drop();
  }
};
