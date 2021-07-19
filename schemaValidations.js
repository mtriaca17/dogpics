const BaseJoi = require('joi');
const sanitizeHTML = require('sanitize-html');

const extension = joi => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include html!',
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHTML(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value) return helpers.error('string.escapeHTML', { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);
// const Joi = require('joi');

module.exports.postSchema = Joi.object({
  post: Joi.object({
    title: Joi.string().required().escapeHTML(),
    image: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
  }).required(),
});

module.exports.commentSchema = Joi.object({
  comment: Joi.object({
    body: Joi.string().required().escapeHTML(),
  }),
});
