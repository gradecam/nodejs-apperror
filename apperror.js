/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
'use strict';

module.exports = AppError;
module.exports.__version__ = require('./package.json')['version'];

var util = require('util');

var _ = require('lodash');

var DEFAULT_LOGGER = console;

function AppError(opts, context) {
    if (!(this instanceof Error)) { return new AppError(opts, context); }
    opts = opts || {};
    if (_.isString(opts)) { opts = {message: opts}; }
    this.message = opts.message || 'An error occurred.';
    this.data = opts.data || '';
    this.code = opts.code || opts.status || opts.statusCode || 500;
    this.statusCode = this.code;
    this.isAppError = true;
    this.logError = _.isUndefined(opts.logError) && true || opts.logError;
    this.captureStack = _.isUndefined(opts.captureStack) && true || opts.captureStack;
    if (this.captureStack) {
        Error.captureStackTrace(this, (context || AppError));
    }
    this._logged = [];
}
util.inherits(AppError, Error);
AppError.prototype.name = 'AppError';
AppError.prototype.toJSON = AppError.prototype.toResponseObject = function toJSON() {
    return {
        type: this.name,
        message: this.message,
        data: this.data,
        code: this.code,
    };

};

AppError.prototype.log = function log(logger) {
    logger = logger || this.DEFAULT_LOGGER || DEFAULT_LOGGER;
    var logged = _.findWhere(this._logged, {logger: logger});
    if (!this.logError || this.logError && logged) {
        return this;
    }
    this._logged.push({logger: logger});
    logger.error(this.toJSON());
    var stack = this.stack;
    if (stack) { logger.error(stack); }
    return this;
};

AppError.createCustom = function createCustom(name, defaults) {
    function CustomError(msgOrOpts, code, data) {
        if (!(this instanceof Error)) { return new CustomError(msgOrOpts, code, data); }
        var opts = _.extend({}, defaults);
        if (_.isObject(msgOrOpts)) {
            opts.message = msgOrOpts.message || msgOrOpts.msg || opts.message || opts.msg;
            opts.code = msgOrOpts.code || msgOrOpts.status || msgOrOpts.statusCode || opts.code || opts.status || opts.statusCode;
            opts.data = msgOrOpts.data || opts.data;
        } else {
            opts.message = msgOrOpts || opts.message || opts.msg;
            opts.code = code || opts.code || opts.status || opts.statusCode;
            opts.data = data || opts.data;
        }
        AppError.call(this, opts, CustomError);
    }
    util.inherits(CustomError, AppError);
    CustomError.prototype.name = name;

    return CustomError;
};
