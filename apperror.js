/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = AppError;

var util = require('util');

function AppError(settings, context) {
    if (!(this instanceof Error)) { return new AppError(settings, context); }
    settings = settings || {};
    if (typeof settings === 'string') { settings = {message: settings} };
    if (!settings.hasOwnProperty('logError')) { settings.logError = true; }
    this.type = settings.type || this.constructor.name;
    this.message = settings.message || 'An error occurred.';
    this.data = settings.data || '';
    this.code = settings.code || settings.statusCode || 500;
    this.statusCode = this.code;
    this.isAppError = true;
    this.logError = settings.logError;
    if (settings.captureStack) {
        Error.captureStackTrace(this, (context || arguments.callee));
    }
    return this;
}
util.inherits(AppError, Error);
AppError.prototype.name = 'AppError';
AppError.prototype.toJSON = toJSON;
AppError.prototype.toResponseObject = toJSON;

function toJSON() {
    return {
        type: this.type,
        message: this.message,
        data: this.data,
        code: this.code,
    };
};

AppError.createCustom = function createCustom(name, defaultMsg, defaultCode, BaseError, captureStack, logError) {
    BaseError = BaseError || AppError;
    function CustomError(msg, code, data) {
        if (!(this instanceof Error)) { return new CustomError.apply(this, arguments); }
        if ('object' === typeof msg) {
            code = msg.code;
            data = msg.data;
            msg = msg.message || msg.msg;
        }
        BaseError.call(this, {
            message: msg || defaultMsg,
            type: name,
            code: code || defaultCode,
            data: data,
            logError: logError,
            captureStack: captureStack,
        }, CustomError);
        return this;
    }
    util.inherits(CustomError, BaseError);
    CustomError.prototype.name = name;

    return CustomError;
}
