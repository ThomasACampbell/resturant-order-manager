const crypto = require('crypto')

function hashPassword(password, callback) {
  const salt = crypto.randomBytes(16)
  crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hashedPassword) => {
    if (err) return callback(err)
    callback(null, { salt, hashedPassword })
  })
}

module.exports = hashPassword
