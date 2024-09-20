module.exports = {
  async up(db, client) {
    await db.createCollection('customertags');
  },

  async down(db, client) {
    await db.collection('customertags').drop();
  }
};
