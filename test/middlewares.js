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
  },
  (ctx) => {
    try {
      if(ctx.request.age && ctx.request.age < 24){
        ctx.request.level = 'A';
      }
    }catch (err) {
      throw err;
    }
  }
];
