/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = AppError;

var util = require('util');

var DEFAULT_ERROR_LEVEL = 'error';
var DEFAULT_LOGGER = console;

function AppError(settings, context) {
    if (!isError(this)) { return new AppError(settings, context); }
    settings = settings || {};
    if (isString(settings)) { settings = {message: settings} };
    if (!has(settings, 'logError')) { settings.logError = true; }
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
    this._logged = false;
    return this;
}
util.inherits(AppError, Error);
AppError.prototype.name = 'AppError';
AppError.prototype.toJSON = toJSON;
AppError.prototype.toResponseObject = toJSON;
AppError.prototype.log = function log(level, logger) {
    logger = logger || this.DEFAULT_LOGGER || DEFAULT_LOGGER;
    level = level || this.DEFAULT_ERROR_LEVEL || DEFAULT_ERROR_LEVEL;
    if (this._logged || !logger || !isFunction(logger[level])) {
        return this;
    }
    logger[level](this.toJSON());
    this._logged = true;
    return this;
}

function toJSON() {
    return {
        type: this.type,
        message: this.message,
        data: this.data,
        code: this.code,
    };
};

AppError.createCustom = function createCustom(name, defaultMsg, defaultCode, captureStack, logError) {
    function CustomError(msg, code, data) {
        if (!isError(this)) { return new CustomError(msg, code, data); }
        if (isObject(msg)) {
            code = msg.code;
            data = msg.data;
            msg = msg.message || msg.msg;
        }
        AppError.call(this, {
            message: msg || defaultMsg,
            type: name,
            code: code || defaultCode,
            data: data,
            logError: logError,
            captureStack: captureStack,
        }, CustomError);
        return this;
    }
    util.inherits(CustomError, AppError);
    CustomError.prototype.name = name;

    return CustomError;
}

var _has = Object.prototype.hasOwnProperty;

function has(obj, prop) {
    return _has.call(obj, prop);
}

function isString(value) {
    return 'string' === typeof value;
}

function isError(value) {
    return value instanceof Error;
}

function isFunction(value) {
    return 'function' === value;
}

function isObject(value) {
    return value && 'object' === typeof value;
}
