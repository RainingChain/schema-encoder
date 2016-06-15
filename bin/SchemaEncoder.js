var SchemaEncoder = (function () {
    function SchemaEncoder(props, propsOption) {
        this.props = [];
        this.propsOption = null;
        this.isArray = false;
        if (props instanceof Array) {
            props = { fake: props };
            this.isArray = true;
        }
        this._construstor_one(props, this.props);
        if (!propsOption)
            return;
        this.propsOption = [];
        this._construstor_one(propsOption, this.propsOption);
        if (this.propsOption.length > 30)
            throw new Error('Exceeded the max optional properties (which is 30).');
    }
    SchemaEncoder.prototype._construstor_one = function (props, pushTo) {
        var keysOption = Object.keys(props).sort();
        for (var i = 0; i < keysOption.length; i++) {
            var val = props[keysOption[i]];
            if (val instanceof Array)
                val[0] = new SchemaEncoder(val[0]);
            else if (val && typeof val === 'object' && !(val instanceof SchemaEncoder))
                val = new SchemaEncoder(val);
            pushTo.push({ key: keysOption[i], value: val });
        }
    };
    SchemaEncoder.prototype._encode_one = function (res, data, props, i) {
        var d = data[props[i].key];
        var val = props[i].value;
        if (!val)
            res.push(d);
        else if (val instanceof SchemaEncoder)
            res.push(val.encode(d));
        else if (val instanceof Array) {
            var sub = [];
            for (var j = 0; j < d.length; j++)
                sub.push(val[0].encode(d[j]));
            res.push(sub);
        }
        else if (val instanceof Function)
            res.push(val(d, true));
        else
            res.push(val);
    };
    SchemaEncoder.prototype.encode = function (data) {
        if (this.isArray)
            data = { fake: data };
        var res = [];
        for (var i = 0; i < this.props.length; i++) {
            this._encode_one(res, data, this.props, i);
        }
        if (this.propsOption) {
            var bools = [];
            res.push(0); //overwritten later
            for (var i = 0; i < this.propsOption.length; i++) {
                var d = data[this.propsOption[i].key];
                bools.push(d !== undefined);
                if (d === undefined)
                    continue;
                this._encode_one(res, data, this.propsOption, i);
            }
            res[this.props.length] = SchemaEncoder.boolArrayToNumber(bools);
        }
        if (this.isArray)
            return res[0];
        return res;
    };
    SchemaEncoder.prototype._decode_one = function (res, d, prop) {
        if (!prop.value)
            res[prop.key] = d;
        else if (prop.value instanceof SchemaEncoder)
            res[prop.key] = prop.value.decode(d);
        else if (prop.value instanceof Array) {
            var sub = [];
            for (var j = 0; j < d.length; j++)
                sub.push(prop.value[0].decode(d[j]));
            res[prop.key] = sub;
        }
        else if (prop.value instanceof Function)
            res[prop.key] = prop.value(d, false);
        else
            res[prop.key] = d;
    };
    SchemaEncoder.prototype.decode = function (data) {
        if (this.isArray)
            data = [data];
        var res = {};
        for (var i = 0; i < this.props.length; i++) {
            this._decode_one(res, data[i], this.props[i]);
        }
        if (this.propsOption) {
            var bools = SchemaEncoder.numberToBoolArray(data[this.props.length], this.propsOption.length);
            var pos = 0;
            for (var i = 0; i < this.propsOption.length; i++) {
                if (!bools[i])
                    continue;
                this._decode_one(res, data[(pos++) + this.props.length + 1], this.propsOption[i]);
            }
        }
        if (this.isArray)
            return res['fake'];
        return res;
    };
    SchemaEncoder.prototype.dencode = function (obj) {
        return this.decode(this.encode(obj));
    };
    SchemaEncoder.unitTest = function () {
        var assert = function (id, t) { if (!t)
            throw new Error(id); };
        //test0
        var schema0 = new SchemaEncoder(Array.of({
            x: null,
            allo: null,
            y: null,
            z: null,
            h: {
                test: null
            },
            test: Array.of({
                a: null
            })
        }));
        var obj0 = [
            { x: 1, y: 1, h: { test: 10 }, allo: 10334, z: 1, test: [{ a: 1 }, { a: 2 }] },
            { x: 1, y: 1, h: { test: 10 }, allo: 10334, z: 1, test: [{ a: 1 }, { a: 2 }] },
        ];
        assert(0, schema0.dencode(obj0)[1].test[0].a === 1);
        assert(0.1, schema0.dencode(obj0)[1].h.test === 10);
        //test0
        var schema1 = new SchemaEncoder({
            x: null,
            allo: SchemaEncoder.NUM_TO_STRING,
            y: null,
            z: null,
            h: {
                b: null
            },
            test: Array.of({
                a: null
            })
        }, {
            opt1: null,
            opt2: null,
            opt3: {
                block: null
            }
        });
        var obj1 = {
            x: 1, y: 1, allo: 12312312312312, z: 1, test: [{ a: 1 }, { a: 2 }],
            h: { b: 1 },
            opt2: true, opt3: { block: 100 }
        };
        assert(1, schema1.dencode(obj1).opt1 === undefined);
        assert(1.1, schema1.dencode(obj1).opt2 === true);
        assert(1.2, schema1.dencode(obj1).opt3.block === 100);
        assert(1.3, schema1.dencode(obj1).x === 1);
        assert(1.4, schema1.dencode(obj1).allo === 12312312312312);
    };
    SchemaEncoder.NUM_TO_STRING = function (d, encode) {
        return encode ? '' + d : +d;
    };
    SchemaEncoder.boolArrayToNumber = function (array) {
        var str = '';
        for (var i = 0; i < array.length; i++)
            str += +array[i];
        return parseInt(str, 2);
    };
    SchemaEncoder.numberToBoolArray = function (num, arrayLength) {
        arrayLength = arrayLength || 0;
        var s = num.toString(2);
        var a = [];
        for (var i = 0; i < s.length; i++)
            a[i] = s[i] === '1';
        var a2 = [];
        for (var i = 0; i < arrayLength - s.length; i++)
            a2.push(false);
        return a2.concat(a);
    };
	
    return SchemaEncoder;
}());
if(typeof exports !== 'undefined'){
	exports.SchemaEncoder = SchemaEncoder
} else {
	window['SchemaEncoder'] = SchemaEncoder;
}


