define([
    'jquery'
], function ($) {
    'use strict';

    function RenderDelayQueue() {
        this.actionList = [];
        this.isProcessing = false;

        this.PROCESS_PER_FRAME = 2;
        this.PROCESS_PER_CALL = 4;
    }

    RenderDelayQueue.prototype.processFrame = function () {
        var actionCallback,
            numToProcess = this.PROCESS_PER_FRAME;

        while(numToProcess-- && this.numToProcess--) {
            actionCallback = this.actionList.shift();
            if(! actionCallback) {
                return this.isProcessing = false;
            }
            actionCallback();
        }

        if (!this.count || !this.actionList.length) {
            return this.isProcessing = false;
        }
        window.setTimeout(this.process.bind(this), 20);
    };

    RenderDelayQueue.prototype.process = function () {
        if(!this.isProcessing) {
            if(!this.actionList.length) {
                return;
            }
            this.numToProcess = this.PROCESS_PER_CALL;
            this.isProcessing = true;
        }

        window.setTimeoutWithRAF(this.processFrame.bind(this), 20);
    };

    RenderDelayQueue.prototype.isBusy = function() {
        return this.isProcessing;
    };

    RenderDelayQueue.prototype.add = function (callback) {
        this.actionList.push(callback);
    };

    RenderDelayQueue.prototype.remove = function (callback) {
        var i, length = this.actionList.length;

        for (i = 0; i < length; i++) {
            if (this.actionList[i] === callback) {
                this.actionList.splice(i, 1);
                return;
            }
        }

        // fail fast to help catch bad code
        throw 'render callback not found';
    };

    return RenderDelayQueue;
});
