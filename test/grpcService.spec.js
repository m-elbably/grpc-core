const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('./config/config').services.users;

const GrpcServer = require('../lib/GrpcServer');
const UsersService = require('./UsersService');
const client = require('./usersClient');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Test gRPC Service', () => {
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

	it('call for "create" function, should return user object', async () => {
		try {
      const result = await client.call('create',{
        email: 'client@grpccore.com',
        firstName: 'grpc',
        lastName: 'user',
        age: 24
      });

      expect(result)
        .to.have.own.property('user')
        .to.be.an('object');

      expect(result)
        .to.have.own.property('created')
        .to.be.equal(true);

      expect(result.user.age)
        .to.be.equal(21);
		} catch(err){
			throw err;
		}
	});

  it('middleware function should add "level" property to result', async () => {
    try {
      const result = await client.call('create',{
        email: 'client@grpccore.com',
        firstName: 'grpc',
        lastName: 'user',
        age: 18
      });

      expect(result.user.level)
        .to.be.equal('A');
    } catch(err){
      throw err;
    }
  });

  it('call for "create" function with wrong data, should return error', async () => {
    try {
      const result = await client.call('create',{
        email: 'client@grpccore.com',
        firstName: 'grpc',
        lastName: 'user',
        age: 17
      });
    } catch(err){
      expect(err.details)
        .to.be.equal('Invalid age');
    }
  });

  it('call for non async functions should return error', async () => {
    try {
      await client.call('delete');
    } catch(err){
      expect(err.details)
        .to.be.equal('Service function must be async');
    }
  });
});
