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
  Object.keys(value).forEach((key) => {
    // req.query can be a read-only property (e.g. frozen by a request sanitizer),
    // so mutate it in place instead of reassigning the reference.
    if (key === 'query') {
      Object.keys(req.query).forEach((queryKey) => delete req.query[queryKey]);
      Object.assign(req.query, value.query);
    } else {
      req[key] = value[key];
    }
  });
  return next();
};

module.exports = validate;
