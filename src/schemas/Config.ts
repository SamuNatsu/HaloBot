/// Config schema
import joi from 'joi';

/* Export schema */
export const schema: joi.ObjectSchema = joi
  .object({
    connection: joi
      .object({
        type: joi
          .string()
          .valid('none', 'http', 'websocket', 'fake')
          .required(),
        config: joi.any().when('type', {
          switch: [
            {
              is: 'none',
              then: joi.forbidden()
            },
            {
              is: 'http',
              then: joi
                .object({
                  http_forward: joi.string().uri().required(),
                  http_reverse_port: joi.number().port().required(),
                  http_reverse_path: joi.string().uri()
                })
                .required()
            },
            {
              is: 'websocket',
              then: joi
                .object({
                  ws_type: joi.string().valid('forward', 'reverse').required(),
                  ws_forward: joi.any().when('ws_type', {
                    is: 'forward',
                    then: joi.string().uri().required(),
                    otherwise: joi.forbidden()
                  }),
                  ws_reverse_port: joi.any().when('ws_type', {
                    is: 'reverse',
                    then: joi.number().port().required(),
                    otherwise: joi.forbidden()
                  }),
                  ws_reverse_path: joi.any().when('ws_type', {
                    is: 'reverse',
                    then: joi.string().uri(),
                    otherwise: joi.forbidden()
                  })
                })
                .required()
            },
            {
              is: 'fake',
              then: joi
                .object({
                  fake_reverse_port: joi.number().port().required(),
                  fake_reverse_path: joi.string().uri()
                })
                .required()
            }
          ]
        })
      })
      .required()
  })
  .unknown(true);
