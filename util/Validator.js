const Joi = require('@hapi/joi');

class Validator {

    constructor() {

        this.joinSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            nickname: Joi.string().max(100).required(),
            room: Joi.string().max(100).required()
        });

        this.messageSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            message: Joi.string().min(1).max(1200).required()
        });

        this.nicknameSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            new: Joi.string().max(100).required()
        });

        this.roomSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            room: Joi.string().max(100).required()
        });

        this.privateSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            personalID: Joi.string().min(8).max(8),
            message: Joi.string().min(1).max(1200).required()
        });

        this.imageSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            data: Joi.string().required(),
            message: Joi.string().max(1200)
        });

        this.captchaSchema = Joi.object({
            socketID: Joi.string().min(13).required(),
            for: Joi.string().max(100).required(),
            captcha: Joi.string().min(6).max(6).required(),
        });

        this.messagesSchema = Joi.object({
            socketID: Joi.string().min(13).required()
        });

        this.usersSchema = Joi.object({
            socketID: Joi.string().min(13).required()
        });

        this.roomsSchema = Joi.object({
            socketID: Joi.string().min(13).required()
        });
    }

    validate(schema, data) {
        var result = schema.validate(data);
        if ('error' in result) {
            return false;
        } else {
            return true;
        }
    }

}
module.exports = Validator;