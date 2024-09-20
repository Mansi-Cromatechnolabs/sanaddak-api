module.exports = {
  async up(db, client) {
    await db.createCollection('storeholidays');
  },

  async down(db, client) {
    await db.collection('storeholidays').drop();
  }
};
