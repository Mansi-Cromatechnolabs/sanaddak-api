module.exports = {
  async up(db, client) {
    await db.createCollection('customer');
  },

  async down(db, client) {
    await db.collection('customer').drop();
  }
};
