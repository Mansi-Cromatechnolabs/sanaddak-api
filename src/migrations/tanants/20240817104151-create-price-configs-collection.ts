module.exports = {
  async up(db, client) {
    await db.createCollection('priceconfigs');
  },

  async down(db, client) {
    await db.collection('priceconfigs').drop();
  }
};
