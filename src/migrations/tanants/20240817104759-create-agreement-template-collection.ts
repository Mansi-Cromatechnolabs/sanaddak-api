module.exports = {
  async up(db, client) {
    await db.createCollection('agreement_template');
    await db.collection('agreement_template').createIndex({ name: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('agreement_template').drop();
  }
};
