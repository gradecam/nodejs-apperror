export interface AppErrorOptions {
  captureStack?: boolean;
  code?: number;
  data?: any;
  logError?: boolean;
  message?: string;
  msg?: string;
  /** alias for code */
  status?: number;
  /** alias for code */
  statusCode?: number;
}

interface LoggerLike {
  error: Function;
}

const DEFAULT_LOGGER: LoggerLike = console;

class AppError extends Error {
  static createCustom(name: string, defaults: AppErrorOptions = {}) {
    class CustomAppError extends AppError {
      constructor(msgOrOpts?: string | AppErrorOptions, code?: number | Function, data?: any) {
        var opts = Object.assign({}, defaults);
        if (typeof code === 'function') {
          super(msgOrOpts, code);
          return;
        } else if (typeof msgOrOpts === 'string') {
          opts.message = msgOrOpts || opts.message || opts.msg;
          opts.code = code || opts.code || opts.status || opts.statusCode;
          opts.data = data || opts.data;
        } else {
          msgOrOpts = msgOrOpts || {};
          opts.message = msgOrOpts.message || msgOrOpts.msg || opts.message || opts.msg;
          opts.code = msgOrOpts.code || msgOrOpts.status || msgOrOpts.statusCode || opts.code || opts.status || opts.statusCode;
          opts.data = msgOrOpts.data || opts.data;
          if (typeof msgOrOpts.captureStack === 'boolean') { opts.captureStack = msgOrOpts.captureStack; }
          if (typeof msgOrOpts.logError === 'boolean') { opts.logError = msgOrOpts.logError; }
        }
        super(opts, CustomAppError);
        return this;
      }
    }
    CustomAppError.prototype.name = name;
    return CustomAppError as typeof AppError & {new (msgOrOpts?: string | AppErrorOptions, code?: number, data?: any): AppError};
  }

  _logged: Array<{logger: LoggerLike}> = [];
  captureStack: boolean;
  code?: number;
  data: any;
  DEFAULT_LOGGER = DEFAULT_LOGGER;
  isAppError: boolean;
  logError: boolean;
  name!: string;
  statusCode?: number;


  constructor(opts?: string | AppErrorOptions, context?: Function) {
    super();
    opts = opts || {};
    if (typeof opts === 'string') { opts = {message: opts}; }
    this.message = opts.message || 'An error occurred.';
    this.data = opts.data || '';
    this.code = opts.code || opts.status || opts.statusCode || 500;
    this.statusCode = this.code;
    this.isAppError = true;
    this.logError = typeof opts.logError !== 'boolean' && true || !!opts.logError;
    this.captureStack = typeof opts.captureStack !== 'boolean' && true || !!opts.captureStack;
    if (this.captureStack && 'captureStackTrace' in Error) {
      Error.captureStackTrace(this, (context || AppError));
    }
  }

  log(logger: LoggerLike = this.DEFAULT_LOGGER) {
    if (typeof logger.error !== 'function' || !this.logError || this.logError || this._logged.length) {
      return this;
    }
    this._logged.push({logger});
    logger.error(this.toJSON());
    var stack = this.stack;
    if (stack) { logger.error(stack); }
    return this;
  }

  toJSON() {
    return {
      type: this.name,
      message: this.message,
      data: this.data,
      code: this.code,
    };
  }
  toResponseObject = this.toJSON;
}
AppError.prototype.name = 'AppError';

export default AppError;
