const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

class GrpcClient {
	/**
	 * @classdesc GrpcClient
	 * > * You need to create instance of GrpcClient to call remote functions implemented in your services
	 * @param {object} options
	 * @param {string} options.proto Service protobuf schema ".proto" file
	 * @param {number} options.service gRPC service name (same name defined in protobuf schema)
	 * @param {number} options.url gRPC server url (host:port)
   * @param {object} [options.loaderOptions] [Protobuf loader](https://github.com/grpc/grpc-node/tree/master/packages/proto-loader) configurations
	 */
	constructor(options){
		const { proto, service, url, loaderOptions } = options;

		this._client = null;
		this._proto = proto;
		this._service = service;
		this._url = url;
		this._loaderOptions = loaderOptions || {
			keepCase: true,
			longs: String,
			enums: String,
			arrays: true,
			defaults: false
		};

		const packageDefinition = protoLoader.loadSync(this._proto, this._loaderOptions);
		const GrpcService = grpc.loadPackageDefinition(packageDefinition)[this._service];
		this._client = new GrpcService(this._url, grpc.credentials.createInsecure());
	}

	/**
	 * Actual remote functions call happen here
	 * @param {string} method method name on gRPC remote service
	 * @param {object} [data] object contains all required arguments for remote method
	 * @param {object} [meta] object contains additional payload data to be passed as gRPC metadata
	 */
	async call(method, data, meta){
		if(!method){
			throw new Error('Remote function name is missing');
		}
		if(!this._client.constructor.service.hasOwnProperty(method)){
			throw new Error('Remote function is missing from proto schema');
		}

		return new Promise((resolve, reject) => {
			let _data = data || {};
			let _meta = {};
			if(meta){
				const md = new grpc.Metadata();
				for(let k in meta){
					let v = meta[k];
					v = (typeof v !== 'string' && v instanceof String) ? String(v) : v;
					md.add(k,v);
				}

				_meta = md;
			}

			this._client[method](_data, _meta, (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}
}

module.exports = GrpcClient;
