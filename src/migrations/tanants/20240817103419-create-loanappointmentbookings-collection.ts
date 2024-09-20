module.exports = {
  async up(db, client) {
    await db.createCollection('loanappointmentbookings');
  },

  async down(db, client) {
    await db.collection('loanappointmentbookings').drop();
  }
};
