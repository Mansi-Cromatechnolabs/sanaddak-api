module.exports = {
  async up(db, client) {
    await db.createCollection('customer_notification');
  },

  async down(db, client) {
    await db.collection('customer_notification').drop();
  }
};
