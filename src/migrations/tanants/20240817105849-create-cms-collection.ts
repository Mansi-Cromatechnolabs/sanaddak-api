module.exports = {
  async up(db, client) {
    await db.createCollection('cms');
  },

  async down(db, client) {
    await db.collection('cms').drop();
  }
};
