const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

class GrpcService {
	/**
	 * @classdesc GrpcService is the base class for your service
	 * > * You need to extend this class and just implement class functions (Exposed functions must be async)
	 * > * Methods starts with _ `underscore` will be ignored and considered private, so it will not be exposed into your gRPC service
   *
   * @param {object} options
   * @param {string} options.proto Service [protobuf](https://developers.google.com/protocol-buffers/docs/proto3) schema
   * @param {object} [options.hooks] Service hooks, helper functions to be attached to request context (ctx) object, which will be passed to callee function
   * @param {object[]} [options.middlewares] Service middlewares, functions that will be execute in order before service function, and will have the request context as argument
   * @param {object} [options.loaderOptions] [Protobuf loader](https://github.com/grpc/grpc-node/tree/master/packages/proto-loader) configurations
   * @param {function} [options.onError] An error handler for service function call
	 */
	constructor(options = {}) {
		const { proto, hooks, middlewares, loaderOptions, onError } = options;

		this._descriptor = proto;
		this._hooks = hooks || {};
		this._middlewares = middlewares || [];
		this._loaderOptions = loaderOptions || {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: false,
			arrays: true,
			oneofs: true
		};
		this._onError = onError;
	}

	/**
   * Apply hook functions to request context object
   * @param context
   * @private
   */
	_applyHooks(context){
		for(let hook in this._hooks) {
			context[hook] = this._hooks[hook];
		}
	}

	/**
   * Cycle through all middleware functions in order, and call it against request context
   * @param context
   * @private
   */
	_applyMiddlewares(context){
		this._middlewares.forEach((mw) => {
			mw.call(null, context);
		});
	}

	/**
   * Get service descriptor for provided protobuf schema (Called by GrpcServer during service creation process)
   * @returns {object} Service descriptor
   */
	descriptor(){
		const packageDefinition = protoLoader.loadSync(this._descriptor, this._loaderOptions);
		const packageObject = grpc.loadPackageDefinition(packageDefinition);

		return packageObject;
	}

	/**
   * Get service implementation for provided protobuf schema (Called by GrpcServer during service creation process)
   * @returns {object} Service implementation, which will be provided by user child class
   */
	implementation(){
		const implementation = {};
		const functions = this.constructor.prototype;
		const names = Object.getOwnPropertyNames(this.constructor.prototype);
		names.forEach((name) => {
			if(name !== 'constructor' && !name.startsWith('_')){
				implementation[name] = (ctx, callback) => {
					if(functions[name].constructor.name !== 'AsyncFunction'){
						return callback(new Error('Service function must be async'));
					}

					this._applyHooks(ctx);
					this._applyMiddlewares(ctx);
					functions[name](ctx)
						.then((result) => {
							callback(null, result);
						})
						.catch((err) => {
							let error = err;
							if(typeof(this._onError) === 'function'){
								error = this._onError(err);
							}

							callback(error);
						});
				};
			}
		});

		return implementation;
	}
}

module.exports = GrpcService;
