const bcrypt = require('bcrypt');
bcrypt.compare('1', '$2b$10$nwC4K.rxVwL3CYg6yUJyHukJDVoZC0yZzgBoVQdOWBDcVZrnC/aIO')
  .then(result => {
    console.log('Password matches:', result);
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });