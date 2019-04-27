const grpc = require('grpc');
const GrpcServer = require('./GrpcServer');
const GrpcService = require('./GrpcService');
const GrpcClient = require('./GrpcClient');

module.exports = {
  grpc,
  GrpcServer,
  GrpcService,
  GrpcClient
};
