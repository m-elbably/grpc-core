const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('./config/config').services.users;

const GrpcServer = require('../lib/GrpcServer');
const UsersService = require('./UsersService');
const client = require('./usersClient');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Test gRPC Client', () => {
  let grpcServer;

  before(async () => {
    grpcServer = new GrpcServer({
      host: config.host,
      port: config.port,
      services: [UsersService]
    });

    await grpcServer.start();
  });

  after(() => {
    grpcServer.shutdown();
  });

  it('calling function without name should return error', async () => {
    try {
      const result = await client.call('');
    } catch(err){
      expect(err.message)
        .to.be.equal('Remote function name is missing');
    }
  });

  it('calling missing function should return error', async () => {
    try {
      const result = await client.call('move');
    } catch(err){
      expect(err.message)
        .to.be.equal('Remote function is missing from proto schema');
    }
  });

  it('calling "create" function with metadata should return meta property in result', async () => {
    try {
      const result = await client.call('create', {email: 'test@grpccore.com'}, {userId: '1466'});

      expect(result)
        .to.have.own.property('user')
        .to.have.own.property('meta')
        .to.be.equal(true);
    } catch(err){
      throw err;
    }
  });
});
