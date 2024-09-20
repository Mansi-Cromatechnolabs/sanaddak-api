module.exports = {
  async up(db, client) {
    await db.createCollection('golditems');
  },

  async down(db, client) {
    await db.collection('golditems').drop();
  }
};
