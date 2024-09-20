module.exports = {
  async up(db, client) {
    await db.createCollection('tags');
  },

  async down(db, client) {
    await db.collection('tags').drop();
  }
};
