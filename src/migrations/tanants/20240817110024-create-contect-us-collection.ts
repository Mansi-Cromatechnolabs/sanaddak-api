module.exports = {
  async up(db, client) {
    await db.createCollection('contectus');
  },

  async down(db, client) {
    await db.collection('contectus').drop();
  }
};
