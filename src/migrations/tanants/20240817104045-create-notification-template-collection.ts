module.exports = {
  async up(db, client) {
    await db.createCollection('notification_template');
    await db.collection('notification_template').createIndex({ key: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('notification_template').drop();
  }
};
