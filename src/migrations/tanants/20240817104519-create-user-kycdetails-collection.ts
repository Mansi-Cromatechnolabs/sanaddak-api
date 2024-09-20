module.exports = {
  async up(db, client) {
    await db.createCollection('userkycdetails');
  },

  async down(db, client) {
    await db.collection('userkycdetails').drop();
  }
};
