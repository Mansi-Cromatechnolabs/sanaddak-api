module.exports = {
  async up(db, client) {
    await db.createCollection('initialvaluations');
  },

  async down(db, client) {
    await db.collection('initialvaluations').drop();
  }
};
