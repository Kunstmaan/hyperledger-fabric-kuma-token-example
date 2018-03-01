const Joi = require('./common/services/joi');

(async function() {
    const object = {
        'array': undefined,
        'foo': 3
    };

    const schema = Joi.object().keys({
        array: Joi.array().required(),
        foo: Joi.number().required().integer()
    });

    try {
        await schema.validate(object);

        await Joi.number().max(object.array.length).label('foo').validate(object.foo);

        console.log('ok');
    } catch (error) {
        if (error.isJoi) {
            console.error(error.message);
        }
    }
}()).then(() => {
}).catch((error) => {
    console.error(error);
});
