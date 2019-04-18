const path = require('path');

const GrpcService = require('../lib/GrpcService');
const proto = path.join(__dirname, './config/users.proto');
const hooks = require('./hooks');
const middlewares = require('./middlewares');

class UsersService extends GrpcService {
  constructor() {
    super({
      proto,
      hooks,
      middlewares,
      onError: (err) => {
        return err;
      }
    });
  }

  async create(ctx){
    try {
      const body = ctx.request;
      ctx.validate(body);

      if(ctx.params && ctx.params.userid){
        body.meta = true;
      }

      return {
        user: body,
        created: true
      };
    }
    catch(err){
      throw err;
    }
  }

  async getUsers() {}
  async getUser() {}

  delete(ctx){
    return true;
  }
}

module.exports = new UsersService();
