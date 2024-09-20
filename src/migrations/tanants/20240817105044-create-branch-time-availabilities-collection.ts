module.exports = {
  async up(db, client) {
    await db.createCollection('branchtimeavailabilities');
  },

  async down(db, client) {
    await db.collection('branchtimeavailabilities').drop();
  }
};
