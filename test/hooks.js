module.exports = {
  validate: (body) => {
    if (!body) {
      throw new Error('Invalid body data');
    }

    if (body.age && body.age < 18) {
      throw new Error('Invalid age');
    }

    return true;
  }
};
