/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = AppError;

var util = require('util');

var DEFAULT_ERROR_LEVEL = 'error';
var DEFAULT_LOGGER = console.log;

function AppError(opts, context) {
    if (!isError(this)) { return new AppError(opts, context); }
    opts = opts || {};
    if (isString(opts)) { opts = {message: opts} };
    this.type = opts.type || this.constructor.name;
    this.message = opts.message || 'An error occurred.';
    this.data = opts.data || '';
    this.code = opts.code || opts.statusCode || 500;
    this.statusCode = this.code;
    this.isAppError = true;
    this.logError = isUndefined(opts.logError) && true || opts.logError;
    this.captureStack = opts.captureStack;
    if (opts.captureStack) {
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
    if (this.logError && this._logged || !isFunction(logger)) {
        return this;
    }
    logger(level.toUpperCase(), this.toJSON());
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

AppError.createCustom = function createCustom(name, defaults) {
    function CustomError(msg, code, data) {
        if (!isError(this)) { return new CustomError(msg, code, data); }
        var opts = clone(defaults);
        if (isObject(msg)) {
            opts.message = msg.message || msg.msg || opts.message || opts.msg;
            opts.code = msg.code || opts.code || opts.statusCode;
            opts.data = msg.data || opts.data;
        } else {
            opts.message = msg || opts.message || opts.msg;
            opts.code = code || opts.code || opts.statusCode;
            opts.data = data || opts.data;
        }
        AppError.call(this, opts, CustomError);
        return this;
    }
    util.inherits(CustomError, AppError);
    CustomError.prototype.name = name;

    return CustomError;
}

var _has = Object.prototype.hasOwnProperty;

function clone(obj) {
    var o = {}, key;
    var keys = Object.getOwnPropertyNames(obj);
    for (var i=0, len=keys.length; i<len; i++) {
        key = keys[i];
        o[key] = obj[key];
    }
    return o;
}

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
    return 'function' === typeof value;
}

function isObject(value) {
    return value && 'object' === typeof value;
}

function isUndefined(value) {
    return 'undefined' === typeof value;
}
