module.exports = {
  async up(db, client) {
    await db.createCollection('loanpaymenttransactions');
  },

  async down(db, client) {
    await db.collection('loanpaymenttransactions').drop();
  }
};
