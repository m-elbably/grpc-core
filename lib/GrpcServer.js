const grpc = require('grpc');

class GrpcServer {
	/**
	 * @classdesc gRPC server will be the entry point to your microservice
	 * @example
	 * const server = new GrpcServer({
	 * 	host: 'localhost',
	 *	port: 5000,
	 *	services: [
	 *		UsersService
	 *	],
	 *	onStart: async () => {
	 *		return database.connect();
	 *	},
	 *	onConnected: () => {
	 *		console.log('Users service is up');
	 *	}
	 * });
	 * server.start(); 
	 * @param {object} config
	 * @param {string} config.host Server host
	 * @param {number} config.port Server port
	 * @param {GrpcService[]} config.services Array of GrpcService derived classes to be exposed
	 * @param {function} [config.onConnected] Function to be executed after server connection
	 * @param {function} [config.onStart] Function to be executed before server start (ex. db connection)
	 * @param {function} [config.onClose] Function to be executed before server shutdown (ex. close db connection)
	*/
	constructor(config) {
		const { host, port, services, onStart, onStarted, onClose } = config;
		this._host = host || 'localhost';
		// eslint-disable-next-line no-undef
		this._port = port || process.env.PORT;
		this._services = services || [];

		this._onStart = onStart;
		this._onStarted = onStarted;
		this._onClose = onClose;
		this._server = new grpc.Server();
	}

	/**
	 * Initialize and register services
	 * @async
	 * @private
	 */
	async _initialize() {
		this._services.forEach((service) => {
			const serviceName = service.constructor.name;
			const descriptor = service.descriptor();
			this._server.addService(descriptor[serviceName].service, service.implementation());
		});
	}

	/**
	 * Get original gRPC server object
	 * @return {object}
	 */
	get server(){
		return this._server;
	}

	/**
	 * Start gRPC server
	 * @async
	 */
	async start() {
		if(typeof(this._onStart) === 'function'){
			await this._onStart();
		}

		await this._initialize();
		this._server.bind(`${this._host}:${this._port}`, grpc.ServerCredentials.createInsecure());
		this._server.start();

		if(typeof(this._onStarted) === 'function'){
			await this._onStarted();
		}
	}

	/**
	 * Shutdown gRPC server
	 * @async
	 */
	async shutdown() {
		await new Promise(async (resolve) => {
			if(typeof(this._onClose) === 'function'){
				await this._onClose();
			}

			this._server.tryShutdown(resolve);
		});
	}
}

module.exports = GrpcServer;
