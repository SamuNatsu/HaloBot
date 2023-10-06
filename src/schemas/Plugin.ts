/// Plugin schema
import joi from 'joi';

/* Export schema */
export const schema: joi.ObjectSchema = joi
  .object({
    meta: joi
      .object({
        namespace: joi
          .string()
          .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/)
          .required(),
        name: joi.string().required(),
        author: joi.string().required(),
        description: joi.string().allow('').required(),
        priority: joi.number().integer().min(1).max(100).required(),
        version: joi
          .string()
          .pattern(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/)
          .required(),
        botVersion: joi
          .string()
          .pattern(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/)
          .required()
      })
      .required()
  })
  .unknown(true);
