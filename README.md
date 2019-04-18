## gRPC-Core
> A simple & minimal helpers for creating high performance gRPC microservices.

[![Node Version](https://img.shields.io/node/v/grpc-core.svg)](https://nodejs.org)
[![npm version](https://img.shields.io/npm/v/grpc-core.svg)](https://www.npmjs.com/package/grpc-core)
[![Build Status](https://img.shields.io/circleci/project/github/m-elbably/grpc-core.svg)](https://img.shields.io/circleci/project/github/m-elbably/grpc-core.svg)
[![coverage status](https://img.shields.io/coveralls/github/m-elbably/grpc-core.svg)](https://coveralls.io/github/m-elbably/grpc-core)
[![License](https://img.shields.io/github/license/m-elbably/grpc-core.svg)](https://raw.githubusercontent.com/m-elbably/grpc-core/master/LICENSE)

This package will simplify the creation of gRPC servers and services, you will just need to extend base GrpcService and implement remote functions, this library will turn your normal functions into gRPC callable functions, which makes it easy to create microservices in a clean way.

Basic microservice archticture using helpers in this library
<br>

![gRPC-Core Diagram](https://raw.githubusercontent.com/m-elbably/grpc-core/master/docs/diagram.png "Basic microservice architecture with gRPC")

> * You need to be familiar with gRPC and protocol buffers.
> * Example in this package uses the proto3 version of the protocol buffers language.
> * You can find out more about gRPC and proto3 in [References](#references) section.

#### Installation
```
npm install grpc-core --save
```

#### Package Components
* GrpcServer: Main entry point to gRPC microservice
* GrpcService: Service endpoint
* GrpcClient: gRPC client to call service methods remotly

#### 1- gRPC Server
You will need to create a new instance from GrpcServer with appropriate configurations then start your server.

> You can register one or more gRPC services with the same server

Example:
```js
const { GrpcServer } = require('grpc-core');
const UsersService = require('./UsersService');
const database = require('./database');

const server = new GrpcServer({
	host: 'localhost',
	port: 3000,
	services: [
		UsersService
	],
	onStart: async () => {
		return database.connect();
	},
	onConnected: () => {
		console.log('Users service is up');
	}
});

server.start(); 
```

**GrpcService constructor(config)**

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| host | `string`  | Server host | &nbsp; |
| port | `number`  | Server port | &nbsp; |
| services | `Array.<GrpcService>`  | Array of GrpcService derived classes to be exposed | &nbsp; |
| onConnected | `function`  | Function to be executed after server connection | *Optional* |
| onStart | `function`  | Function to be executed before server start (ex. db connection) | *Optional* |
| onClose | `function`  | Function to be executed before server shutdown (ex. close db connection) | *Optional* |

#### 2- gRPC Service
You will need to create your own service class which extends GrpcService class, and normal class methods will ne callable from your GrpcClient.

> * Async methods are supported.
> * Methods starts with _ `underscore` will be ignored and considered private, so it will not be exposed into your gRPC service, even if you expose it in your protobuf schema, so it will get missing implementation error.

Example:
```js
const path = require('path');
const { GrpcService } = require('grpc-core');
const hooks = require('../grpc/serviceHooks');
const middlewares = require('../grpc/serviceMiddlewares');
const PROTO = path.join(__dirname, '../config/proto/users.proto');
const User = require('../database/models/user');

class UsersService extends GrpcService {
    constructor(){
        super({
            proto: PROTO,
            hooks: hooks,
            middlewares: middlewares
        });
    }

    // Private method (will not be callable)	
    async _getUserId(user) {
        return user._id;
    }

    async getUsers(ctx) {
        return User.find({});
    }

    async create(ctx){
        try {
            const body = ctx.request;
            await ctx.validateParams(userCreateSchema, body);
            return User.create(body);
        } catch(err) {
            throw err;
        }
    }

    async update(ctx){
        try {
            const _id = ctx.request._id;          
	    // Your update code
            return { updated: true};
        } catch(err) {
            throw err;
        }
    }

    async delete(ctx) {
        try {
            const _id = ctx.request._id;          
	    // Your delete code
            return { delete: true};
        } catch(err){
            throw err;
        }
    }
}
```

**GrpcService Hooks**

> **Hooks** are simply helper functions to be attached to request context (ctx) object, which will be passed later to callee function.

> *Hooks are passed to GrpcService as an object which contains all hook functions*  

Ex. if we need the request context object to have our own validation function, we will need to define this in hooks:
```js
// hooks.js
module.exports = {
  validate: (body) => {
    // Validation logic here
  }
};
```

```js
// Then use it in service definition
const { GrpcService } = require('grpc-core');
const hooks = require('./hooks');
const proto = path.join(__dirname, './users.proto');

class UsersService extends GrpcService {
  constructor() {
    super({
      proto,
      hooks
    });
  }
  
  // within our remote function implementation, 
  // hook function will be attached to context object for convenience.
  async create(ctx) {
      try {
        const user = ctx.request;
        // validate function attached to context object
        ctx.validate(user);
        // add user logic
        return user;
      }
      catch(err){
        throw err;
      }
  }
}

module.exports = new UsersService();
```

**GrpcService Middlewares**

> **Middlewares** are just functions that will be execute in order before service function
 and will have the request context as an argument, so inside middleware you can manipulate request data, or request context itself

> *Middlewares are passed to GrpcService as an array of functions*

Ex. Adding middleware to parse request metadata and add it to *params* field:
```js
// middlewares.js
module.exports = [
  // Metadata parser
  (ctx) => {
    try {
      const md = ctx.metadata.getMap();
      if (md) {
        ctx.params = md;
      }
    }catch (err) {
      throw err;
    }
  }
];
```

```js
// Then use it in service definition
const { GrpcService } = require('grpc-core');
const middlewares = require('./middlewares');
const proto = path.join(__dirname, './users.proto');

class UsersService extends GrpcService {
  constructor() {
    super({
      proto,
      middlewares
    });
  }
  
  // within our remote function implementation, 
  // ctx object should contain [params] field if caller passed any metadata
  async create(ctx) {
      try {
        const params = ctx.params;
        return params;
      }
      catch(err){
        throw err;
      }
  }
}
```

#### 3- gRPC Client
> GrpcClient instance is required to call remote GrpcService functions,
It has only one function "call" which enable a simple way call remote functions.

Creating new GrpcClient:
```js
// usersClient.js
const path = require('path');
const { GrpcClient } = require('grpc-core');
const usersProto = path.join(__dirname, './users.proto');

module.exports = new GrpcClient({
  proto: usersProto,
  service: 'UsersService',
  url: 'localhost:3000',
});
```

Using GrpcClient:

```js
const client = require('./usersClient');

async function createUser() {
    try {
      const result = await client.call('create', {email: 'test@grpccore.com'});

    } catch(err){
      throw err;
    }
}
```

TODO

- [ ] Example - API Gateway with simple services
- [ ] gRPC errors handling  
 

#### References
* [gRPC](https://grpc.io)
* [gRPC Node.js](https://grpc.io/docs/tutorials/basic/node.html)
* [proto3 language guide](https://developers.google.com/protocol-buffers/docs/proto3)
* [Microservices Architecture](https://microservices.io)

#### License
MIT
