const config = {
    db: process.env.MONGODB_URI || 'mongodb://localhost:27017/stadium',
    secret: process.env.SECRET || 'supersecret',
    expiresPassword: parseInt(process.env.EXPIRES_PASSWORD) || 86400, // expires in 24hours
    saltRounds: parseInt(process.env.SALT_ROUNDS) || 10,
    port: process.env.PORT || 3000,
    hostname: process.env.HOSTNAME || '127.0.0.1'
}
 
 module.exports = config;