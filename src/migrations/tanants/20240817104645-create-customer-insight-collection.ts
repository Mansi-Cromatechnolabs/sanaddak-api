module.exports = {
  async up(db, client) {
    await db.createCollection('CustomerInsight');
  },

  async down(db, client) {
    await db.collection('CustomerInsight').drop();
  }
};
