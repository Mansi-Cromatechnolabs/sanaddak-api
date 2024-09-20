module.exports = {
  async up(db, client) {
    await db.createCollection('email_template');
    await db.collection('email_template').createIndex({ name: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('email_template').drop();
  }
};
