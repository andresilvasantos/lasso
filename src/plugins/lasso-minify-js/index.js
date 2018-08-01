var UglifyJS = require('uglify-es');
var internalOptions = ['inlineOnly'];
var hasOwn = Object.prototype.hasOwnProperty;

function minify(src, pluginOptions, dependency) {
    var minifyOptions = {};
    for (var key in pluginOptions) {
        if (hasOwn.call(pluginOptions, key) && internalOptions.indexOf(key) === -1) {
            minifyOptions[key] = pluginOptions[key];
        }
    }

    var result = UglifyJS.minify(src, minifyOptions)
    if(result.error) console.log('Error:', dependency.file, result.error)
    if(result.warnings) console.log('Warning:', dependency.file, result.warnings)
    return result.code
}

function isInline(lassoContext) {
    if (lassoContext.inline === true) {
        return true;
    }

    if (lassoContext.dependency && lassoContext.dependency.inline === true) {
        return true;
    }

    return false;
}

module.exports = function (lasso, pluginConfig) {
    lasso.addTransform({
        contentType: 'js',

        name: module.id,

        stream: false,

        transform: function(code, lassoContext) {
            if (pluginConfig.inlineOnly === true && !isInline(lassoContext)) {
                // Skip minification when we are not minifying inline code
                return code;
            }

            try {
                var minified = minify(code, pluginConfig, lassoContext.dependency);
                if (minified.length && !minified.endsWith(';')) {
                    minified += ';';
                }
                return minified;
            } catch (e) {
                if (e.line) {
                    var dependency = lassoContext.dependency;
                    console.error('Unable to minify the following code for ' + dependency + ' at line ' + e.line + ' column ' + e.col + ':\n' +
                                  '------------------------------------\n' +
                                  code + '\n' +
                                  '------------------------------------\n');
                    return code;
                } else {
                    throw e;
                }
            }
        }
    });
};
