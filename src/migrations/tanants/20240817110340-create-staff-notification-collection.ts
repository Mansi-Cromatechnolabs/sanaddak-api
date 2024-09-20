module.exports = {
  async up(db, client) {
    await db.createCollection('staff_notification');
  },

  async down(db, client) {
    await db.collection('staff_notification').drop();
  }
};
