module.exports = {
  async up(db, client) {
    await db.createCollection('contectdetails');
  },

  async down(db, client) {
    await db.collection('contectdetails').drop();
  }
};
