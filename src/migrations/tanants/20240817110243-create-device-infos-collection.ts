module.exports = {
  async up(db, client) {
    await db.createCollection('deviceinfos');
  },

  async down(db, client) {
    await db.collection('deviceinfos').drop();
  }
};
