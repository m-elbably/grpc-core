const path = require('path');
const GrpcClient = require('../lib/GrpcClient');
const {users} = require('./config/config').services;
const usersProto = path.join(__dirname, './config/users.proto');

module.exports = new GrpcClient({
  proto: usersProto,
  service: 'UsersService',
  url: `${users.host}:${users.port}`,
});
