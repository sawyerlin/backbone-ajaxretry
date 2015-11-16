(define(['backbone', 'underscore', 'jquery'], function(Backbone, _, $) {
    var settings = {
        base: 2.718281828,
        y: 0.25,
        retryCount: 3
    };

    this.setOptions = function(options) {
        settings = _.defaults(options, settings);
    };

    function exponentialDelay(x) {
        return (Math.pow(settings.base, x) - settings.y) * 1000;
    }

    function sliceArguments() {
        return Array.prototype.slice.call(arguments, 0);
    }

    function exhausted() {
        var args = sliceArguments(arguments); 
        _.extend(args[0], this);
        if (this.hasOwnProperty('exhaust')) {
            this.exhaust.apply(this, args);
        }
    }

    function ajaxRetry(jqXHR) {
        var self = this;
        if (self.hasOwnProperty('retries')) {
            self.recursed = _.isUndefined(self.recursed) ? 0 : self.recursed + 1;
            if ((jqXHR && jqXHR.status < 400) || self.recursed >= self.retries) {
                exhausted.apply(self, arguments);
            } else if (self.recursed < self.retries) {
                setTimeout(function() {
                    $.ajax(self);
                }, exponentialDelay(self.recursed));
            }
        }
    }

    function extender(args, options) {
        var error = options.error;
        _.extend(args[0], options && typeof options === 'object' ? options: {}, {
            retries: settings.retryCount,
            error: function() {
                if (this.hasOwnProperty('exhaust')) {
                    ajaxRetry.apply(this, arguments);
                } else if (this.hasOwnProperty('error')) {
                    error.apply(this, arguments);
                }
            }
        });
    }

    Backbone.ajax = function(options) {
        var args = sliceArguments(arguments);
        extender(args, options);
        return Backbone.$.ajax.apply(Backbone.$, args);
    };
}));
