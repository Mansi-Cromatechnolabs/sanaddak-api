module.exports = {
  async up(db, client) {
    await db.createCollection('loanemis');
  },

  async down(db, client) {
    await db.collection('loanemis').drop();
  }
};
