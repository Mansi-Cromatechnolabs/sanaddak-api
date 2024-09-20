module.exports = {
  async up(db, client) {
    await db.createCollection('loan_application_status');
  },

  async down(db, client) {
    await db.collection('loan_application_status').drop();
  }
};
