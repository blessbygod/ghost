define("ghost/assets/lib/touch-editor", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var createTouchEditor = function createTouchEditor() {
        var noop = function () {},
            TouchEditor;
    
        TouchEditor = function (el, options) {
            /*jshint unused:false*/
            this.textarea = el;
            this.win = {document: this.textarea};
            this.ready = true;
            this.wrapping = document.createElement('div');
    
            var textareaParent = this.textarea.parentNode;
    
            this.wrapping.appendChild(this.textarea);
            textareaParent.appendChild(this.wrapping);
    
            this.textarea.style.opacity = 1;
        };
    
        TouchEditor.prototype = {
            setOption: function (type, handler) {
                if (type === 'onChange') {
                    $(this.textarea).change(handler);
                }
            },
            eachLine: function () {
                return [];
            },
            getValue: function () {
                return this.textarea.value;
            },
            setValue: function (code) {
                this.textarea.value = code;
            },
            focus: noop,
            getCursor: function () {
                return {line: 0, ch: 0};
            },
            setCursor: noop,
            currentLine: function () {
                return 0;
            },
            cursorPosition: function () {
                return {character: 0};
            },
            addMarkdown: noop,
            nthLine: noop,
            refresh: noop,
            selectLines: noop,
            on: noop,
            off: noop
        };
    
        return TouchEditor;
    };
    
    __exports__["default"] = createTouchEditor;
  });
define("ghost/assets/lib/uploader", 
  ["ghost/utils/ghost-paths","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ghostPaths = __dependency1__["default"];

    
    var UploadUi,
        upload,
        Ghost = ghostPaths();
    
    UploadUi = function ($dropzone, settings) {
        var $url = '<div class="js-url"><input class="url js-upload-url" type="url" placeholder="http://"/></div>',
            $cancel = '<a class="image-cancel js-cancel" title="Delete"><span class="hidden">Delete</span></a>',
            $progress =  $('<div />', {
                class: 'js-upload-progress progress progress-success active',
                role: 'progressbar',
                'aria-valuemin': '0',
                'aria-valuemax': '100'
            }).append($('<div />', {
                class: 'js-upload-progress-bar bar',
                style: 'width:0%'
            }));
    
        $.extend(this, {
            complete: function (result) {
                var self = this;
    
                function showImage(width, height) {
                    $dropzone.find('img.js-upload-target').attr({width: width, height: height}).css({display: 'block'});
                    $dropzone.find('.fileupload-loading').remove();
                    $dropzone.css({height: 'auto'});
                    $dropzone.delay(250).animate({opacity: 100}, 1000, function () {
                        $('.js-button-accept').prop('disabled', false);
                        self.init();
                    });
                }
    
                function animateDropzone($img) {
                    $dropzone.animate({opacity: 0}, 250, function () {
                        $dropzone.removeClass('image-uploader').addClass('pre-image-uploader');
                        $dropzone.css({minHeight: 0});
                        self.removeExtras();
                        $dropzone.animate({height: $img.height()}, 250, function () {
                            showImage($img.width(), $img.height());
                        });
                    });
                }
    
                function preLoadImage() {
                    var $img = $dropzone.find('img.js-upload-target')
                        .attr({src: '', width: 'auto', height: 'auto'});
    
                    $progress.animate({opacity: 0}, 250, function () {
                        $dropzone.find('span.media').after('<img class="fileupload-loading"  src="' + Ghost.subdir + '/ghost/img/loadingcat.gif" />');
                        if (!settings.editor) {$progress.find('.fileupload-loading').css({top: '56px'}); }
                    });
                    $dropzone.trigger('uploadsuccess', [result]);
                    $img.one('load', function () {
                        animateDropzone($img);
                    }).attr('src', result);
                }
                preLoadImage();
            },
    
            bindFileUpload: function () {
                var self = this;
    
                $dropzone.find('.js-fileupload').fileupload().fileupload('option', {
                    url: Ghost.apiRoot + '/uploads/',
                    add: function (e, data) {
                        /*jshint unused:false*/
                        $('.js-button-accept').prop('disabled', true);
                        $dropzone.find('.js-fileupload').removeClass('right');
                        $dropzone.find('.js-url').remove();
                        $progress.find('.js-upload-progress-bar').removeClass('fail');
                        $dropzone.trigger('uploadstart', [$dropzone.attr('id')]);
                        $dropzone.find('span.media, div.description, a.image-url, a.image-webcam')
                            .animate({opacity: 0}, 250, function () {
                                $dropzone.find('div.description').hide().css({opacity: 100});
                                if (settings.progressbar) {
                                    $dropzone.find('div.js-fail').after($progress);
                                    $progress.animate({opacity: 100}, 250);
                                }
                                data.submit();
                            });
                    },
                    dropZone: settings.fileStorage ? $dropzone : null,
                    progressall: function (e, data) {
                        /*jshint unused:false*/
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        if (!settings.editor) {$progress.find('div.js-progress').css({position: 'absolute', top: '40px'}); }
                        if (settings.progressbar) {
                            $dropzone.trigger('uploadprogress', [progress, data]);
                            $progress.find('.js-upload-progress-bar').css('width', progress + '%');
                        }
                    },
                    fail: function (e, data) {
                        /*jshint unused:false*/
                        $('.js-button-accept').prop('disabled', false);
                        $dropzone.trigger('uploadfailure', [data.result]);
                        $dropzone.find('.js-upload-progress-bar').addClass('fail');
                        if (data.jqXHR.status === 413) {
                            $dropzone.find('div.js-fail').text('上传的图片超出了服务器端允许的大小。');
                        } else if (data.jqXHR.status === 415) {
                            $dropzone.find('div.js-fail').text('上传的图片类型不被支持。请检查是否是 .PNG、.JPG、.GIF、.SVG 格式。');
                        } else {
                            $dropzone.find('div.js-fail').text('发生故障了 :(');
                        }
                        $dropzone.find('div.js-fail, button.js-fail').fadeIn(1500);
                        $dropzone.find('button.js-fail').on('click', function () {
                            $dropzone.css({minHeight: 0});
                            $dropzone.find('div.description').show();
                            self.removeExtras();
                            self.init();
                        });
                    },
                    done: function (e, data) {
                        /*jshint unused:false*/
                        self.complete(data.result);
                    }
                });
            },
    
            buildExtras: function () {
                if (!$dropzone.find('span.media')[0]) {
                    $dropzone.prepend('<span class="media"><span class="hidden">上传图片</span></span>');
                }
                if (!$dropzone.find('div.description')[0]) {
                    $dropzone.append('<div class="description">添加图片</div>');
                }
                if (!$dropzone.find('div.js-fail')[0]) {
                    $dropzone.append('<div class="js-fail failed" style="display: none">发生故障了：(</div>');
                }
                if (!$dropzone.find('button.js-fail')[0]) {
                    $dropzone.append('<button class="js-fail btn btn-green" style="display: none">重试</button>');
                }
                if (!$dropzone.find('a.image-url')[0]) {
                    $dropzone.append('<a class="image-url" title="添加图片地址（URL）"><span class="hidden">URL</span></a>');
                }
               // if (!$dropzone.find('a.image-webcam')[0]) {
               //     $dropzone.append('<a class="image-webcam" title="Add image from webcam"><span class="hidden">Webcam</span></a>');
               // }
            },
    
            removeExtras: function () {
                $dropzone.find('span.media, div.js-upload-progress, a.image-url, a.image-upload, a.image-webcam, div.js-fail, button.js-fail, a.js-cancel').remove();
            },
    
            initWithDropzone: function () {
                var self = this;
    
                // This is the start point if no image exists
                $dropzone.find('img.js-upload-target').css({display: 'none'});
                $dropzone.find('div.description').show();
                $dropzone.removeClass('pre-image-uploader image-uploader-url').addClass('image-uploader');
                this.removeExtras();
                this.buildExtras();
                this.bindFileUpload();
                if (!settings.fileStorage) {
                    self.initUrl();
                    return;
                }
                $dropzone.find('a.image-url').on('click', function () {
                    self.initUrl();
                });
            },
            initUrl: function () {
                var self = this, val;
                this.removeExtras();
                $dropzone.addClass('image-uploader-url').removeClass('pre-image-uploader');
                $dropzone.find('.js-fileupload').addClass('right');
                if (settings.fileStorage) {
                    $dropzone.append($cancel);
                }
                $dropzone.find('.js-cancel').on('click', function () {
                    $dropzone.find('.js-url').remove();
                    $dropzone.find('.js-fileupload').removeClass('right');
                    $dropzone.trigger('imagecleared');
                    self.removeExtras();
                    self.initWithDropzone();
                });
    
                $dropzone.find('div.description').before($url);
    
                if (settings.editor) {
                    $dropzone.find('div.js-url').append('<button class="btn btn-blue js-button-accept">保存</button>');
                }
    
                $dropzone.find('.js-button-accept').on('click', function () {
                    val = $dropzone.find('.js-upload-url').val();
                    $dropzone.find('div.description').hide();
                    $dropzone.find('.js-fileupload').removeClass('right');
                    $dropzone.find('.js-url').remove();
                    if (val === '') {
                        $dropzone.trigger('uploadsuccess', 'http://');
                        self.initWithDropzone();
                    } else {
                        self.complete(val);
                    }
                });
    
                // Only show the toggle icon if there is a dropzone mode to go back to
                if (settings.fileStorage !== false) {
                    $dropzone.append('<a class="image-upload" title="添加图片"><span class="hidden">上传</span></a>');
                }
    
                $dropzone.find('a.image-upload').on('click', function () {
                    $dropzone.find('.js-url').remove();
                    $dropzone.find('.js-fileupload').removeClass('right');
                    self.initWithDropzone();
                });
            },
    
            initWithImage: function () {
                var self = this;
    
                // This is the start point if an image already exists
                $dropzone.removeClass('image-uploader image-uploader-url').addClass('pre-image-uploader');
                $dropzone.find('div.description').hide();
                $dropzone.find('img.js-upload-target').show();
                $dropzone.append($cancel);
                $dropzone.find('.js-cancel').on('click', function () {
                    $dropzone.find('img.js-upload-target').attr({src: ''});
                    $dropzone.find('div.description').show();
                    $dropzone.trigger('imagecleared');
                    $dropzone.delay(2500).animate({opacity: 100}, 1000, function () {
                        self.init();
                    });
    
                    $dropzone.trigger('uploadsuccess', 'http://');
                    self.initWithDropzone();
                });
            },
    
            init: function () {
                var imageTarget = $dropzone.find('img.js-upload-target');
                // First check if field image is defined by checking for js-upload-target class
                if (!imageTarget[0]) {
                    // This ensures there is an image we can hook into to display uploaded image
                    $dropzone.prepend('<img class="js-upload-target" style="display: none"  src="" />');
                }
                $('.js-button-accept').prop('disabled', false);
                if (imageTarget.attr('src') === '' || imageTarget.attr('src') === undefined) {
                    this.initWithDropzone();
                } else {
                    this.initWithImage();
                }
            },
    
            reset: function () {
                $dropzone.find('.js-url').remove();
                $dropzone.find('.js-fileupload').removeClass('right');
                this.removeExtras();
                this.initWithDropzone();
            }
        });
    };
    
    upload = function (options) {
        var settings = $.extend({
            progressbar: true,
            editor: false,
            fileStorage: true
        }, options);
    
        return this.each(function () {
            var $dropzone = $(this),
                ui;
    
            ui = new UploadUi($dropzone, settings);
            this.uploaderUi = ui;
            ui.init();
        });
    };
    
    __exports__["default"] = upload;
  });
define('ghost/templates/-contributors', ['exports'], function(__exports__){ __exports__['default'] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<li>\n    <a href=\"https://github.com/jaswilli\" title=\"jaswilli\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/jaswilli\" alt=\"jaswilli\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/PaulAdamDavis\" title=\"PaulAdamDavis\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/PaulAdamDavis\" alt=\"PaulAdamDavis\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/ErisDS\" title=\"ErisDS\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/ErisDS\" alt=\"ErisDS\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/cobbspur\" title=\"cobbspur\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/cobbspur\" alt=\"cobbspur\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/felixrieseberg\" title=\"felixrieseberg\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/felixrieseberg\" alt=\"felixrieseberg\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/novaugust\" title=\"novaugust\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/novaugust\" alt=\"novaugust\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/JohnONolan\" title=\"JohnONolan\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/JohnONolan\" alt=\"JohnONolan\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/rwjblue\" title=\"rwjblue\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/rwjblue\" alt=\"rwjblue\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/Gargol\" title=\"Gargol\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/Gargol\" alt=\"Gargol\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/sebgie\" title=\"sebgie\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/sebgie\" alt=\"sebgie\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/jgable\" title=\"jgable\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/jgable\" alt=\"jgable\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/dbalders\" title=\"dbalders\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/dbalders\" alt=\"dbalders\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/jillesme\" title=\"jillesme\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/jillesme\" alt=\"jillesme\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/javorszky\" title=\"javorszky\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/javorszky\" alt=\"javorszky\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/mattiascibien\" title=\"mattiascibien\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/mattiascibien\" alt=\"mattiascibien\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/RaoHai\" title=\"RaoHai\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/RaoHai\" alt=\"RaoHai\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/halfdan\" title=\"halfdan\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/halfdan\" alt=\"halfdan\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/matthojo\" title=\"matthojo\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/matthojo\" alt=\"matthojo\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/hswolff\" title=\"hswolff\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/hswolff\" alt=\"hswolff\">\n    </a>\n</li>\n<li>\n    <a href=\"https://github.com/tgriesser\" title=\"tgriesser\">\n        <img src=\"");
  data.buffer.push(escapeExpression(((helpers['gh-path'] || (depth0 && depth0['gh-path']) || helperMissing).call(depth0, "admin", "/img/contributors", {"name":"gh-path","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","STRING"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("/tgriesser\" alt=\"tgriesser\">\n    </a>\n</li>");
  return buffer;
},"useData":true}); });
//# sourceMappingURL=ghost.js.map