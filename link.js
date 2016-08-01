/**
 * Created by stumpx@163.com on 2016/7/24.
 */

/*
===================================================================
【data-link插件，data-api或javascript设置属性后，点击即可发送请求】
===================================================================

【data-api（设置元素data-link-* 属性）】

data-link = "www.example.com"                 //[必须]请求地址，默认为空字符串
[data-link-type = "post|get"]                 //[可选]请求类型，默认为"POST"
[data-link-target = "_blank|_self|selector"]  //[可选]响应数据替换目标，_blank|_self|selector，新窗口|当前窗口|选择器
[data-link-data = object]                     //[可选]请求参数，默认为空对象
[data-link-data-form = "selector"]            //[可选]请求表单，默认为空字符串，设置后表单数据会覆盖data-link-data
[data-link-data-type = "json|xml"]            //[可选]响应数据类型，默认为json，且默认请求后置函数只处理json数据
[data-link-confirm = "string"]                //[可选]确认信息，默认为空字符串
[data-link-async = false|true]                //[可选]异步或同步请求，默认false同步
[data-link-on-before = "funcName"]            //[可选]请求前置事件函数，第一个参数为事件对象，第二个参数为请求参数对象
[data-link-on-after = "funcName"]             //[可选]请求后置事件函数，第一个参数为事件对象，第二个参数为响应数据

===================================================================
【javascript（js设置属性）】

$('#data-link').link([{
[link: "string",]                      //[可选：元素有data-link属性时可选]请求地址，默认为空字符串
[type: "post|get",]                  //[可选]请求类型，默认为"POST"
[data: object,]                      //[可选]请求参数，默认为空对象
[dataForm: "selector",]              //[可选]请求表单，默认为空字符串，设置后表单数据会覆盖data
[dataType: "json|xml",]              //[可选]响应数据类型，默认为json，且默认请求后置函数只处理json数据
[target: "_blank|_self|selector",]   //[可选]响应数据替换目标，_blank|_self|selector，新窗口|当前窗口|选择器
[confirm: "string",]                 //[可选]确认信息，默认为空字符串
[async: false|true,]                 //[可选]异步或同步请求，默认false同步
[before: function(e,request){},]     //[可选]请求前置事件函数，第一个参数为事件对象，第二个参数为请求参数对象
[after: function(e,response){},]     //[可选]请求后置事件函数，第一个参数为事件对象，第二个参数为响应数据
}])

$('#data-link').link('options'[,object]);   //获取或设置属性
===================================================================
*/

(function ($) {

    var events = {/*默认事件*/
        after: function (e, res) {
            /*default.events.before*/
            var target = $(this).data('link-target');
            if (res.status == 1) {
                $(target).html(res.data);
            } else {
                if(!isEmptyObject(bootbox)){
                    bootbox.alert(res.info);
                }else{
                    alert(res.info);
                }
            }
        },
        before: function (e, req) {
            /*default.events.before*/
        }
    };

    var defaults = {/*默认属性*/
        link: '',
        type: 'POST',
        data: {},
        dataForm: '',
        dataType: 'JSON',
        target: '#body',
        confirm: false,
        async: false,
        after: events.after,
        before: events.before,
    };

    var methods = {/*函数*/
        init: function (options) {/*初始化*/
            return this.each(function () {
                var $this = $(this);
                options = getOptions($this,options);
                setOptions($this, options);
            });
        },
        options: function(options){/*获取或设置属性*/
            var $this = $(this);
            if (!options) {
                return getOptions($this);
            }else{
                setOptions($this,options);
                return true;
            }
        },
        destroy: function () {/*释放绑定的数据*/
            return this.each(function () {
                var $this = $(this);
                $this
                    .removeData('link-type')
                    .removeData('link-data')
                    .removeData('link-data-form')
                    .removeData('link-data-type')
                    .removeData('link-target')
                    .removeData('link-confirm')
                    .removeData('link-async')
                    .removeData('link-on-after')
                    .removeData('link-on-before')
                    .off('after')
                    .off('before')
                ;
            })
            return true;
        },
    };

    function isEmptyObject(obj) {/*是否为空对象*/
        if (typeof obj == "object") {
            for (var k in obj)
                return false;
            return true;
        }
        return true;
    }

    function unserialize(str){/*反序列化*/
        var obj = {};
        str.split('&').forEach(function(param){
            param = param.split('=');
            var name = param[0],value = param[1];
            obj[name] = !!value ? decodeURI(value) : "";
        });
        return obj;
    }

    function getOptions($this,options) {/*获取属性*/
        var settings = {};

        var url = $this.data('link');/*请求地址*/
        var href = $this.attr('href');/*获取超链接地址*/
        if (!url && href) url = href;/*兼容分页超链接*/
        /*if (!url) return false;*//*没有地址不发送请求*/
        var type = $this.data('link-type');/*请求类型*/
        var data = $this.data('link-data');/*请求参数*/
        var dataForm = $this.data('link-data-form');/*请求表单*/
        var dataType = $this.data('link-data-type');/*响应数据类型*/
        var confirm = $this.data('link-confirm');/*确认信息*/
        var target = $this.data('link-target');/*响应的数据显示位置*/
        var async = $this.data('link-async');/*同步或异步请求*/
        var before = $this.data('link-on-before');/*前置操作*/
        var after = $this.data('link-on-after');/*后置操作*/

        if (url) settings.link = url;
        if (type) settings.type = type;
        if (!isEmptyObject(data)) settings.data = data;
        if (dataForm){
            settings.dataForm = dataForm;
            settings.data = unserialize($(dataForm).serialize());
        }
        if (dataType) settings.dataType = dataType;
        if (target) settings.target = target;
        if (confirm) settings.confirm = confirm;
        if (async) settings.async = async;
        if (after) settings.after = after;
        if (before) settings.before = before;

        return $.extend({}, defaults, settings, options);
    }

    function setOptions($this, options) {/*设置属性*/
        options = $.extend({}, defaults, options);
        $this
            .data('link', options.link)
            .data('link-type', options.type)
            .data('link-data', options.data)
            .data('link-data-form', options.dataForm)
            .data('link-data-type', options.dataType)
            .data('link-target', options.target)
            .data('link-confirm', options.confirm)
            .data('link-async', options.async)
            .data('link-on-after', options.after)
            .data('link-on-before', options.before)
            .off('after').on('after', typeof options.after == 'string' ? eval(options.after) : options.after)
            .off('before').on('before', typeof options.before == 'string' ? eval(options.before) : options.before)
        ;
    }

    function getFormStrByObj(options) {/*将对象变成表单*/
        var str = '<form id="link" style="display:none" action="' + options.link + '" target="' + options.target + '" method="' + options.type + '">';
        for (var k in options.data) {
            var v = options.data[k];
            str += '<input type="hidden" name="' + k + '" value="' + v + '"/>';
        }
        str += '</form>';
        return str;
    }

    function doAjax(param) {/*ajax请求*/
        $.ajax({
            url: param.link,
            type: param.type,
            async: param.async,/*true：异步，false：同步*/
            data: param.data,
            dataType: param.dataType,
            success: function (res) {
                $(param.$this).trigger('after', res);
            },
            error: function (error) {/*请求报错*/
                if(!isEmptyObject(bootbox)) {
                    bootbox.alert(error.status + ' : ' + error.statusText);
                }else{
                    alert(error.status + ' : ' + error.statusText);
                }
            }
        });
    }

    $(document).on('click', '[data-link]', function () {/*通用单击ajax请求或跳转*/
        var $this = $(this);
        var options = getOptions($this);/*请求参数*/
        if(!options.link) return false;/*没有地址不发送请求*/
        setOptions($this,options);
        if (!!options.before) $this.trigger('before', options.data);
        options.$this = $this;

        var $frm = $(getFormStrByObj(options));
        if (options.target == '_blank' || options.target == '_self') {/*使用form打开*/
            $frm.appendTo('body').trigger('submit').remove();
            return false;
        }

        typeof bootbox == 'object' || (bootbox = {});/*检测bootbox插件是否存在*/
        if (!!options.confirm) {/*确认对话框*/
            if (!isEmptyObject(bootbox)) {
                bootbox.confirm(options.confirm, function (result) {
                    if (result) {
                        doAjax(options);
                    }
                })
            } else {
                if (confirm(options.confirm)) {
                    doAjax(options);
                }
            }
        } else {/*直接执行*/
            doAjax(options);
        }

        return false;
    });

    $.fn.link = function (method) {/*链接插件*/
        if (methods[method]) {/*执行方法*/
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {/*设置选项*/
            return methods.init.apply(this, arguments);
        } else {/*不通过*/
            $.error('Method ' + method + ' does not exist on jQuery.link');
        }
    };

})(jQuery);
