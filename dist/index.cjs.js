'use strict';

var path = require('path');
var rollup = require('rollup');

const build = () => {
    rollup.rollup({
        input: path.resolve('../'),
    });
};

exports.build = build;
