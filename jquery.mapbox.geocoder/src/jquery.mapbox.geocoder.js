(function ($) {

    var pluginName = "mapboxAutocomplete";
    var defaults = {
        accessToken: '',
        endpoint: 'https://api.mapbox.com/geocoding/v5/',
        mode: 'mapbox.places',
        language: 'fr',
        width: '100%',
        zindex: '1000'
    };

    function Plugin(element, options) {

        this.element = $(element);
        this.$elem = $(this.element);
        this._name = pluginName;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;

        return this.init();
    };

    Plugin.prototype = {

        options: function (option, val) {
            this.settings[option] = val;
        },

        // Constructing Tabs Plugin
        init: function () {
            var input = this.element;
            input.wrap('<div class="address-autocomplete-wrapper"></div>');
            var wrapper = $('.address-autocomplete-wrapper');
            input.after('<input hidden name="mbaa-found-address" value="" />');
            input.after('<ul id="mbaa-result-address-autocomplete" class="mbaa-results-list"></ul>');
            var results = $('#mbaa-result-address-autocomplete');
            var chosen = "";
            var features = null;

            var parseQuery = function (query, options) {
                query = encodeURI(query);
                var url = options.endpoint + options.mode + '/' + query + '.json';
                var params = 'access_token=' + options.accessToken + '&language=' + options.language;
                return url + '?' + params;
            };

            var parseResults = function () {
                $.each(features, function (index, feature) {
                    results.append('<li data-id="' + feature.id + '" class="mbaa">' + feature.place_name + '</li>');
                });

                results.find('li').each(function (index, item) {
                    var li = $(this);
                    parseResultsLi(li);
                });
            };

            var initKeydown = function () {
                input.unbind('keydown').on('keydown', function (e) {
                    if (e.keyCode === 40) {
                        if (chosen === "") {
                            chosen = 0;
                        } else if ((chosen + 1) < results.find('li').length) {
                            chosen++;
                        }
                        results.find('li').removeClass('selected');
                        results.find('li:eq(' + chosen + ')').addClass('selected');
                        return false;
                    }
                    if (e.keyCode === 38) {
                        if (chosen === "") {
                            chosen = 0;
                        } else if (chosen > 0) {
                            chosen--;
                        }
                        results.find('li').removeClass('selected');
                        results.find('li:eq(' + chosen + ')').addClass('selected');
                    }
                });
            };

            var parseResultsLi = function (li) {
                li.on('click', function () {
                    var id = $(this).data('id');
                    $.each(features, function (index, feature) {
                        if (feature.id === id) {
                            var object = parseFoundResult(feature);
                            $('input[name="mbaa-found-address"]').val(JSON.stringify(object));
                            results.removeClass('mbaa-fill');
                            input.val(object.formatted_address)
                                .removeClass('mbaa-address-autocomplete')
                                .trigger('mapboxAutocomplete.found.address', [object, feature]);
                        }
                    });
                });
            };

            var initEnter = function () {
                input.on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        var id = results.find('li.mbaa.selected').data('id');
                        $.each(features, function (index, feature) {
                            if (feature.id === id) {
                                var object = parseFoundResult(feature);
                                $('input[name="mbaa-found-address"]').val(JSON.stringify(object));
                                results.removeClass('mbaa-fill');
                                input.val(object.formatted_address)
                                    .removeClass('mbaa-address-autocomplete')
                                    .trigger('mapboxAutocomplete.found.address', [object, feature]);
                            }
                        });
                    }
                });
            };

            var parseFoundResult = function (feature) {
                var street = feature.place_name.split(', ')[0];
                var street_number = feature.address;
                street = street.replace(street_number + ' ', '');

                var object = {
                    point: {
                        lat: feature.center[1],
                        long: feature.center[0]
                    },
                    formatted_address: feature.place_name,
                    region: '',
                    country: '',
                    city: '',
                    zipcode: '',
                    street: street,
                    number: street_number
                };
                $.each(feature.context, function (i, c) {
                    if (c.id.indexOf("place") >= 0) {
                        object.city = c.text;
                    } else if (c.id.indexOf("postcode") >= 0) {
                        object.zipcode = c.text;
                    } else if (c.id.indexOf("region") >= 0) {
                        object.region = c.text;
                    } else if (c.id.indexOf("country") >= 0) {
                        object.country_long = c.text;
                        object.country = c.short_code;
                    }
                });
                return object;
            };

            var init = function (options) {
                wrapper.css('width', options.width);
                input.css('width', options.width);
                results.css('width', options.width);
                wrapper.find('ul.mbaa-results-list').css('z-index', options.zindex);
                input.on('keyup', function (e) {
                    if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 13) {
                        return;
                    }
                    chosen = '';
                    var query = $(this).val();
                    var url = parseQuery(query, options);
                    $.get(url, function (response) {
                        input.addClass('mbaa-address-autocomplete');
                        results.find('li.mbaa').remove();
                        results.addClass('mbaa-fill');

                        if (response.features) {
                            features = response.features;
                            parseResults();
                        }
                    });
                });
            };

            initKeydown();
            initEnter();
            init(this.settings);
        }
    };

    $.fn[pluginName] = function (options) {
        var args = $.makeArray(arguments),
            after = args.slice(1);

        return this.each(function () {

            var instance = $.data(this, pluginName);

            if (instance) {
                if (instance[options]) {
                    instance[options].apply(instance, after);
                } else {
                    $.error('Method ' + options + ' does not exist on Plugin ?');
                }
            } else {
                // create the plugin
                var plugin = new Plugin(this, options);

                // Store the plugin instance on the element
                $.data(this, pluginName, plugin);
                return plugin;
            }
        });
    };


})(jQuery);