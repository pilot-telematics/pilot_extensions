Ext.define('Store.communal.MnemoRenderer', {
    singleton: true,

    defaultCanvas: {
        width: 1200,
        height: 800
    },
    selectionPadding: 8,
    buildSensorKey: function (sensor) {
        return [
            sensor.vehiclenumber || '',
            sensor.group || '',
            sensor.name || ''
        ].join('::');
    },

    buildSensorIndex: function (rows) {
        var index = {};

        Ext.Array.each(rows || [], function (row) {
            var data = row && row.isModel ? row.getData() : row,
                key = data.sensor_key || this.buildSensorKey(data);

            if (key) {
                // Value fields resolve live readings through this lookup map.
                index[key] = data;
            }
        }, this);

        return index;
    },

    ensureCanvas: function (schema) {
        schema = schema || {};
        schema.canvas = schema.canvas || Ext.clone(this.defaultCanvas);
        schema.elements = Ext.isArray(schema.elements) ? schema.elements : [];
        this.ensureUniqueElementIds(schema.elements);

        return schema;
    },

    ensureUniqueElementIds: function (elements) {
        var seen = {},
            invalidElements = [],
            nextId = 1;

        Ext.Array.each(elements || [], function (element) {
            var rawId = element ? element.id : null,
                trimmed = Ext.isEmpty(rawId) ? '' : String(rawId).trim(),
                id = parseInt(trimmed, 10);

            if (!isNaN(id) && id > 0 && String(id) === trimmed && !seen[id]) {
                element.id = id;
                seen[id] = true;
                if (id >= nextId) {
                    nextId = id + 1;
                }
                return;
            }

            invalidElements.push(element);
        });

        Ext.Array.each(invalidElements, function (element) {
            while (seen[nextId]) {
                nextId += 1;
            }

            element.id = nextId;
            seen[nextId] = true;
            nextId += 1;
        });
    },

    renderTo: function (containerEl, schema, sensorRows, options) {
        var me = this,
            dom = containerEl && containerEl.dom ? containerEl.dom : containerEl,
            preparedSchema = me.ensureCanvas(Ext.clone(schema || {})),
            sensorIndex = me.buildSensorIndex(sensorRows || []),
            draw;

        if (!dom || typeof SVG === 'undefined') {
            return null;
        }

        dom.innerHTML = '';
        draw = me.createCanvas(dom, preparedSchema.canvas);

        if (!draw) {
            return null;
        }

        draw.rect(preparedSchema.canvas.width, preparedSchema.canvas.height)
            .fill('#f8fafc')
            .stroke({color: '#cbd5e1', width: 1});

        Ext.Array.each(preparedSchema.elements, function (elementCfg) {
            me.drawElement(draw, elementCfg, sensorIndex, options || {});
        });

        return draw;
    },

    createCanvas: function (dom, canvas) {
        var draw = null;

        try {
            // The svg.js build bundled with PILOT uses SVG(container) style initialization.
            draw = SVG(dom);
        } catch (e) {
            try {
                draw = SVG().addTo(dom);
            } catch (ignored) {
                draw = null;
            }
        }

        if (!draw) {
            return null;
        }

        if (draw.size) {
            draw.size('100%', '100%');
        }

        if (draw.viewbox) {
            draw.viewbox(0, 0, canvas.width, canvas.height);
        } else if (draw.attr) {
            draw.attr({
                viewBox: '0 0 ' + canvas.width + ' ' + canvas.height
            });
        }

        return draw;
    },

    drawElement: function (draw, cfg, sensorIndex, options) {
        var me = this,
            group = draw.group(),
            transformGroup = group.group(),
            visualGroup = transformGroup.group(),
            hitGroup = transformGroup.group(),
            labelText,
            sensorStroke,
            sensorFill;

        cfg.x = Number(cfg.x || 0);
        cfg.y = Number(cfg.y || 0);
        cfg.width = Number(cfg.width || 0);
        cfg.height = Number(cfg.height || 0);

        switch (cfg.type) {
            case 'symbol':
                me.drawSymbol(visualGroup, cfg);
                me.addHitArea(hitGroup, cfg.width || 72, cfg.height || 72);
                break;

            case 'sensor':
                sensorStroke = Ext.isEmpty(cfg.stroke) ? 'none' : cfg.stroke;
                sensorFill = Ext.isEmpty(cfg.fillColor) ? 'none' : cfg.fillColor;
                if (Number(cfg.stemHeight || 0) > 0) {
                    visualGroup.line(
                        (cfg.width || 34) / 2,
                        cfg.height || 34,
                        (cfg.width || 34) / 2,
                        Number(cfg.height || 34) + Number(cfg.stemHeight || 0)
                    ).stroke({
                        color: sensorStroke,
                        width: Ext.isEmpty(cfg.strokeWidth) ? 2 : Number(cfg.strokeWidth),
                        linecap: 'round'
                    });
                }
                visualGroup.circle(Math.min(cfg.width, cfg.height))
                    .fill(sensorFill)
                    .stroke({
                        color: sensorStroke,
                        width: Ext.isEmpty(cfg.strokeWidth) ? 2 : Number(cfg.strokeWidth)
                    });
                labelText = visualGroup.text(cfg.text || 'S').font({size: cfg.fontSize || 14, family: 'Arial, sans-serif', weight: 700});
                labelText.fill(cfg.textColor || '#000000');
                labelText.center((cfg.width || 34) / 2, (cfg.height || 34) / 2);
                break;

            case 'label':
                me.drawTextElement(visualGroup, cfg, cfg.text || 'Label');
                break;

            case 'value':
                me.drawTextElement(visualGroup, cfg, me.resolveValueText(cfg, sensorIndex));
                break;
        }

        group._selectionTarget = visualGroup;
        me.applyElementTransform(transformGroup, cfg);
        group.move(cfg.x, cfg.y);
        group.addClass('communal-mnemo-element');
        group.attr({'data-mnemo-id': cfg.id});

        if (options.onElementClick) {
            group.on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                options.onElementClick.call(options.scope || this, cfg);
            });
        }

        if (options.draggable && group.draggable) {
            me.bindDragHandlers(group, cfg, options);
        }

        if (options.selectedId && options.selectedId === cfg.id) {
            me.setLiveSelection(group);
        }

        return group;
    },

    addHitArea: function (group, width, height) {
        group.rect(Number(width || 72), Number(height || 72))
            .move(0, 0)
            .fill('#ffffff')
            .opacity(0.001)
            .stroke({color: '#ffffff', width: 0})
            .addClass('communal-mnemo-hitarea')
            .back();
    },

    drawSymbol: function (group, cfg) {
        var width = Number(cfg.width || 72),
            height = Number(cfg.height || 72),
            baseWidth = Number(cfg.baseWidth || 64),
            baseHeight = Number(cfg.baseHeight || 64),
            primitives = Ext.isArray(cfg.primitives) ? cfg.primitives : [],
            resizeMode = cfg.resizeMode || 'scale';

        if (!primitives.length) {
            group.rect(width, height).radius(6).fill('#ffffff').stroke({color: '#cbd5e1', width: 1});
            group.text(cfg.label || '?').font({size: 14, family: 'Arial, sans-serif', weight: 700}).center(width / 2, height / 2);
            return;
        }

        Ext.Array.each(primitives, function (primitive) {
            this.drawPrimitive(group, primitive, cfg);
        }, this);

        if (resizeMode !== 'direct' && (baseWidth !== width || baseHeight !== height)) {
            group.scale(width / baseWidth, height / baseHeight, 0, 0);
        }
    },

    applyElementTransform: function (group, cfg) {
        var rotation = Number(cfg.rotation || 0),
            width = Number(cfg.width || 0),
            height = Number(cfg.height || 0);

        if (!Ext.isEmpty(cfg.opacity)) {
            group.opacity(Number(cfg.opacity));
        }

        if (rotation !== 0) {
            group.rotate(rotation, width / 2, height / 2);
        }
    },

    drawPrimitive: function (group, primitive, cfg) {
        var element = null,
            type = primitive.type || '',
            strokeColor = this.getPrimitiveStroke(primitive, cfg),
            fillColor = this.getPrimitiveFill(primitive, cfg),
            textColor = primitive.fill !== undefined ? primitive.fill : (cfg.textColor || '#000000'),
            strokeWidth = primitive.strokeWidth !== undefined ? Number(primitive.strokeWidth) : Number(cfg.strokeWidth || 2),
            fontSize = primitive.fontSize !== undefined ? Number(primitive.fontSize) : Number(cfg.fontSize || 14),
            attrs = {};

        switch (type) {
            case 'line':
                attrs = primitive.fitToElement ? this.resolveLineGeometry(primitive, cfg) : {
                    x1: primitive.x1,
                    y1: primitive.y1,
                    x2: primitive.x2,
                    y2: primitive.y2
                };
                element = group.line(attrs.x1, attrs.y1, attrs.x2, attrs.y2);
                element.stroke({
                    color: strokeColor,
                    width: strokeWidth,
                    linecap: primitive.linecap || 'round',
                    dasharray: primitive.dasharray || null
                });
                break;

            case 'rect':
                element = group.rect(
                    primitive.fitToElement ? Math.max(0, Number(cfg.width || 0) - (Number(primitive.x || 0) * 2)) : primitive.width,
                    primitive.fitToElement ? Math.max(0, Number(cfg.height || 0) - (Number(primitive.y || 0) * 2)) : primitive.height
                ).move(primitive.x || 0, primitive.y || 0);
                if (primitive.rx || primitive.ry) {
                    element.radius(Number(primitive.rx || primitive.ry || 0), Number(primitive.ry || primitive.rx || 0));
                }
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'circle':
                element = group.circle((primitive.r || 0) * 2).center(primitive.cx, primitive.cy);
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'ellipse':
                element = group.ellipse((primitive.rx || 0) * 2, (primitive.ry || 0) * 2).center(primitive.cx, primitive.cy);
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'polygon':
                element = group.polygon(primitive.points);
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'polyline':
                element = group.polyline(primitive.points);
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'path':
                element = group.path(primitive.d);
                this.applyPrimitiveStyle(element, type, strokeColor, fillColor, strokeWidth, primitive);
                break;

            case 'text':
                element = group.text(String(primitive.text || ''));
                element.font({
                    size: fontSize,
                    family: primitive.fontFamily || 'Arial, sans-serif',
                    weight: primitive.fontWeight || 700
                });
                element.fill(textColor);
                if (primitive.textAnchor) {
                    attrs['text-anchor'] = primitive.textAnchor;
                }
                if (primitive.dominantBaseline) {
                    attrs['dominant-baseline'] = primitive.dominantBaseline;
                }
                if (!Ext.Object.isEmpty(attrs)) {
                    element.attr(attrs);
                }
                element.move(primitive.x || 0, primitive.y || 0);
                break;
        }

        if (element && primitive.opacity !== undefined) {
            element.opacity(Number(primitive.opacity));
        }

        if (element && primitive.rotation) {
            element.rotate(Number(primitive.rotation), Number(primitive.cx || primitive.x || 0), Number(primitive.cy || primitive.y || 0));
        }

        return element;
    },

    resolveLineGeometry: function (primitive, cfg) {
        var baseWidth = Number(cfg.baseWidth || cfg.width || 0),
            baseHeight = Number(cfg.baseHeight || cfg.height || 0),
            width = Number(cfg.width || baseWidth || 0),
            height = Number(cfg.height || baseHeight || 0),
            fitMode = primitive.fitToElement;

        switch (fitMode) {
            case 'horizontalCenter':
                return {
                    x1: Number(primitive.x1 || 0),
                    y1: height / 2,
                    x2: width - (baseWidth - Number(primitive.x2 || 0)),
                    y2: height / 2
                };
            case 'verticalCenter':
                return {
                    x1: width / 2,
                    y1: Number(primitive.y1 || 0),
                    x2: width / 2,
                    y2: height - (baseHeight - Number(primitive.y2 || 0))
                };
            case 'diagonalForward':
                return {
                    x1: Number(primitive.x1 || 0),
                    y1: height - (baseHeight - Number(primitive.y1 || 0)),
                    x2: width - (baseWidth - Number(primitive.x2 || 0)),
                    y2: Number(primitive.y2 || 0)
                };
            case 'diagonalBack':
                return {
                    x1: Number(primitive.x1 || 0),
                    y1: Number(primitive.y1 || 0),
                    x2: width - (baseWidth - Number(primitive.x2 || 0)),
                    y2: height - (baseHeight - Number(primitive.y2 || 0))
                };
            default:
                return {
                    x1: Number(primitive.x1 || 0),
                    y1: Number(primitive.y1 || 0),
                    x2: Number(primitive.x2 || 0),
                    y2: Number(primitive.y2 || 0)
                };
        }
    },

    applyPrimitiveStyle: function (element, type, strokeColor, fillColor, strokeWidth, primitive) {
        var strokeCfg;

        if (type === 'polyline' || type === 'line') {
            element.fill('none');
        } else {
            element.fill(fillColor || 'none');
        }

        if (strokeColor === 'none') {
            element.stroke({color: 'none', width: 0});
        } else {
            strokeCfg = {
                color: strokeColor,
                width: strokeWidth
            };

            if (primitive && primitive.dasharray) {
                strokeCfg.dasharray = primitive.dasharray;
            }

            if (primitive && primitive.linecap) {
                strokeCfg.linecap = primitive.linecap;
            }

            element.stroke(strokeCfg);
        }
    },

    getPrimitiveStroke: function (primitive, cfg) {
        if (primitive.stroke !== undefined) {
            return primitive.stroke;
        }

        return cfg.stroke || cfg.color || '#111111';
    },

    getPrimitiveFill: function (primitive, cfg) {
        if (primitive.type === 'line' || primitive.type === 'polyline') {
            return 'none';
        }

        if (cfg.fillColor !== undefined && cfg.fillColor !== null && cfg.fillColor !== '' && primitive.fill !== 'none') {
            return cfg.fillColor;
        }

        if (primitive.fill !== undefined) {
            return primitive.fill;
        }

        return cfg.fillColor !== undefined ? cfg.fillColor : 'none';
    },

    bindDragHandlers: function (group, cfg, options) {
        var me = this,
            startX = 0,
            startY = 0,
            dragStartX = 0,
            dragStartY = 0,
            dragging = false;

        group.draggable();

        group.on('beforedrag', function (event) {
            var sourceEvent = me.getDragSourceEvent(event);

            if (!sourceEvent) {
                return;
            }

            dragging = false;
            startX = Number(cfg.x || 0);
            startY = Number(cfg.y || 0);
            dragStartX = Number(sourceEvent.clientX || 0);
            dragStartY = Number(sourceEvent.clientY || 0);

            me.setLiveSelection(group);

            if (options.onElementDragStart) {
                options.onElementDragStart.call(options.scope || this, cfg);
            }
        });

        group.on('dragmove', function (event) {
            var sourceEvent = me.getDragSourceEvent(event),
                deltaX,
                deltaY,
                nextX,
                nextY;

            if (!sourceEvent) {
                return;
            }

            dragging = true;
            deltaX = Number(sourceEvent.clientX || 0) - dragStartX;
            deltaY = Number(sourceEvent.clientY || 0) - dragStartY;
            nextX = startX + deltaX;
            nextY = startY + deltaY;

            cfg.x = nextX;
            cfg.y = nextY;
            group.move(nextX, nextY);

            if (options.onElementDrag) {
                options.onElementDrag.call(options.scope || this, cfg, {
                    x: Math.round(nextX),
                    y: Math.round(nextY)
                });
            }

            if (event && event.preventDefault) {
                event.preventDefault();
            }
        });

        group.on('dragend', function () {
            if (!dragging) {
                return;
            }

            dragging = false;

            if (options.onElementDrag) {
                options.onElementDrag.call(options.scope || this, cfg, {
                    x: Math.round(Number(cfg.x || 0)),
                    y: Math.round(Number(cfg.y || 0))
                });
            }
        });
    },

    getDragSourceEvent: function (event) {
        var detail = event && (event.detail || event);

        return detail ? detail.event : null;
    },

    setLiveSelection: function (group) {
        var svgNode = group && group.node ? group.node.ownerSVGElement : null,
            existing,
            targetGroup,
            bbox,
            padding = Number(this.selectionPadding || 0),
            selection;

        if (!svgNode) {
            return;
        }

        existing = svgNode.querySelectorAll('.communal-mnemo-selection');
        Ext.Array.each(existing, function (node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });

        targetGroup = group._selectionTarget || group;

        if (targetGroup.rbox) {
            bbox = targetGroup.rbox(group);
        } else {
            bbox = targetGroup.bbox();
        }

        selection = group.rect(
            bbox.width + (padding * 2),
            bbox.height + (padding * 2)
        )
            .move(bbox.x - padding, bbox.y - padding)
            .fill('none')
            .stroke({
                color: '#2563eb',
                width: 1,
                dasharray: '5 3'
            })
            .addClass('communal-mnemo-selection');

        selection.back();
    },

    drawTextElement: function (group, cfg, value) {
        var textFill = Ext.isEmpty(cfg.textColor) ? '#000000' : cfg.textColor,
            rectFill = Ext.isEmpty(cfg.fillColor) ? 'none' : cfg.fillColor,
            rectStroke = Ext.isEmpty(cfg.stroke) ? 'none' : cfg.stroke,
            text = group.text(value).font({
                size: cfg.fontSize || 18,
                family: 'Arial, sans-serif',
                weight: cfg.fontWeight || 600
            }).fill(textFill),
            box = text.bbox(),
            rect = group.rect(box.width + 10, box.height + 8)
                .radius(4)
                .fill(rectFill)
                .stroke({
                    color: rectStroke,
                    width: Ext.isEmpty(cfg.strokeWidth) ? 1 : Number(cfg.strokeWidth)
                });

        rect.back();
        text.move(5, 4);
    },

    resolveValueText: function (cfg, sensorIndex) {
        var sensor = sensorIndex[cfg.sensor_key],
            value = sensor ? sensor.hum_value : null;

        if (Ext.isEmpty(value)) {
            value = l(cfg.placeholder || 'No data');
        }

        return [cfg.prefix || '', value, cfg.suffix || ''].join('');
    },

    previewMarkup: function (item) {
        var markup = '',
            primitives = Ext.isArray(item.primitives) ? item.primitives : [],
            baseWidth = Number(item.baseWidth || 64),
            baseHeight = Number(item.baseHeight || 64);

        if (item.insertType === 'sensor') {
            if (Number(item.stemHeight || 0) > 0) {
                markup += '<line x1="32" y1="50" x2="32" y2="' + Ext.String.htmlEncode(50 + Number(item.stemHeight || 0)) + '" stroke="' + Ext.String.htmlEncode(item.stroke || '#111111') + '" stroke-width="' + Ext.String.htmlEncode(item.strokeWidth || 2) + '" stroke-linecap="round"/>';
            }

            markup += '<circle cx="32" cy="32" r="18" fill="' + Ext.String.htmlEncode(item.fillColor || '#ffffff') + '" stroke="' + Ext.String.htmlEncode(item.stroke || '#111111') + '" stroke-width="' + Ext.String.htmlEncode(item.strokeWidth || 2) + '"/>' +
                '<text x="32" y="37" text-anchor="middle" font-size="14" font-family="Arial" font-weight="700" fill="' + Ext.String.htmlEncode(item.textColor || item.stroke || '#111111') + '">' + Ext.String.htmlEncode(item.previewText || item.text || 'P') + '</text>';
        } else if (item.previewText) {
            markup = '<rect x="8" y="18" width="48" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>' +
                '<text x="32" y="36" text-anchor="middle" font-size="14" font-family="Arial" font-weight="700" fill="#111111">' + Ext.String.htmlEncode(item.previewText) + '</text>';
        } else {
            Ext.Array.each(primitives, function (primitive) {
                markup += this.primitiveMarkup(primitive, item);
            }, this);
        }

        return '<svg viewBox="0 0 ' + baseWidth + ' ' + baseHeight + '" class="communal-mnemo-library-svg">' + markup + '</svg>';
    },

    primitiveMarkup: function (primitive, cfg) {
        var stroke = this.getPrimitiveStroke(primitive, cfg),
            fill = this.getPrimitiveFill(primitive, cfg),
            strokeWidth = primitive.strokeWidth !== undefined ? primitive.strokeWidth : (cfg.strokeWidth || 2),
            attrs = '';

        function attr(name, value) {
            if (value === undefined || value === null || value === '') {
                return '';
            }
            return ' ' + name + '="' + String(value).replace(/"/g, '&quot;') + '"';
        }

        attrs += attr('stroke', stroke);
        attrs += attr('stroke-width', strokeWidth);
        attrs += attr('fill', fill);
        attrs += attr('stroke-dasharray', primitive.dasharray);
        attrs += attr('stroke-linecap', primitive.linecap);
        attrs += attr('opacity', primitive.opacity);

        switch (primitive.type) {
            case 'line':
                return '<line' + attr('x1', primitive.x1) + attr('y1', primitive.y1) + attr('x2', primitive.x2) + attr('y2', primitive.y2) + attrs + '/>';
            case 'rect':
                return '<rect' + attr('x', primitive.x) + attr('y', primitive.y) + attr('width', primitive.width) + attr('height', primitive.height) + attr('rx', primitive.rx) + attr('ry', primitive.ry) + attrs + '/>';
            case 'circle':
                return '<circle' + attr('cx', primitive.cx) + attr('cy', primitive.cy) + attr('r', primitive.r) + attrs + '/>';
            case 'ellipse':
                return '<ellipse' + attr('cx', primitive.cx) + attr('cy', primitive.cy) + attr('rx', primitive.rx) + attr('ry', primitive.ry) + attrs + '/>';
            case 'polygon':
                return '<polygon' + attr('points', primitive.points) + attrs + '/>';
            case 'polyline':
                return '<polyline' + attr('points', primitive.points) + attrs + '/>';
            case 'path':
                return '<path' + attr('d', primitive.d) + attrs + '/>';
            case 'text':
                return '<text' +
                    attr('x', primitive.x) +
                    attr('y', primitive.y) +
                    attr('font-size', primitive.fontSize || cfg.fontSize || 14) +
                    attr('font-family', primitive.fontFamily || 'Arial, sans-serif') +
                    attr('font-weight', primitive.fontWeight || 700) +
                    attr('text-anchor', primitive.textAnchor) +
                    attr('dominant-baseline', primitive.dominantBaseline) +
                    attr('fill', primitive.fill || cfg.textColor || cfg.stroke || '#111111') +
                    '>' + Ext.String.htmlEncode(primitive.text || '') + '</text>';
            default:
                return '';
        }
    }
});
