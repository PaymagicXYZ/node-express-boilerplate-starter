const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  if (value.body) {
    req.body = value.body;
  }
  // req.query (and req.params) are read-only getters on Express >= 4.20, so
  // replace their contents in place instead of reassigning the whole object.
  ['query', 'params'].forEach((key) => {
    if (value[key] && req[key]) {
      Object.keys(req[key]).forEach((k) => delete req[key][k]);
      Object.assign(req[key], value[key]);
    }
  });
  return next();
};

module.exports = validate;
