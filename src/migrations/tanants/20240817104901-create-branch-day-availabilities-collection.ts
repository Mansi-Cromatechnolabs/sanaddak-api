module.exports = {
  async up(db, client) {
    await db.createCollection('branchdayavailabilities');
  },

  async down(db, client) {
    await db.collection('branchdayavailabilities').drop();
  }
};
