const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('./config/config').services.users;

const GrpcServer = require('../lib/GrpcServer');
const UsersService = require('./UsersService');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Test gRPC Server', () => {
  let grpcServer;
  const log = {};

  before(() => {
    grpcServer = new GrpcServer({
      host: config.host,
      port: config.port,
      services: [UsersService],
      onStart: () => {
        return new Promise((resole) => {
          log['init'] = Date.now();
          setTimeout(() => {
            log['onStart'] = Date.now();
            resole();
          }, 1000);
        });
      },
      onStarted: () => {
        log['onStarted'] = Date.now();
      },
      onClose: () => {
        log['onClose'] = Date.now();
      }
    });
  });

  after(async () => {
    await grpcServer.shutdown();
  });

	it('onStart function should be executed before server starts', async () => {
		try {
			await grpcServer.start();

			expect(log.onStart > log.init)
				.to.be.equal(true);
			expect(log.onStart - log.init >= 1000)
				.to.be.equal(true);
		} catch(err){
			throw err;
		}
	});

	it('server property should return original gRPC object', async () => {
		try {
			expect(grpcServer.server)
				.to.be.an('object');
		} catch(err){
			throw err;
		}
	});

	it('onStarted function should be executed after server starts', async () => {
		try {
			expect(log.onStarted > log.onStart)
				.to.be.equal(true);
		} catch(err){
			throw err;
		}
	});

	it('onClose function should be executed after server shutdown', async () => {
		try {
			await grpcServer.shutdown();
			expect(log)
				.to.have.own.property('onClose')
				.to.be.an('number');
		} catch(err){
			throw err;
		}
	});
});
