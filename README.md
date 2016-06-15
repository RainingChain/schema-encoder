Schema-Encoder for Javascript
==================================================

The purpose of this library is to minimize the size of objects that follow a schema known by both the server and the client. In short, the library removes the keys and keep the values intact. 

It does not perform any validation of the data to encode. Use a schema validation library for that.

The library is meant to be used in conjunction with a binary encoder that will compress the data further. For example [BinSON](https://github.com/rainingchain/BinSON).

## Basic Example

	var SchemaEncoder = require('./SchemaEncoder').SchemaEncoder;
	//in a browser, SchemaEncoder is global
	
	var monsterSchema = new SchemaEncoder({
		hitpoints:null,
		name:null,
		position:{
			x:null,
			y:null,
		},
		strength:null,
	});
	var myMonster = {
		hitpoints:100,
		name:"Bob",
		position:{
			mapModel:11,
			x:125,
			y:114,
		},
		strength:30,		
	}
	var encoded = monsterSchema.encode(myMonster); //[100,"Bob",[11,125,114],30]
	monsterSchema.decode(encoded); //=== myMonster
	
## Format`new

`new SchemaEncoder(props,propsOptional?)`

`props` is an object following holding the keys.

`propsOptional` is an object following holding the optional keys.

The keys can be associated with:

`null` : Leave value intact. Useful for primitive or data not following a specific schema.

`object | SchemaEncoder`: An embed schema. 

`Array.of(object)`: Indicate that the key holds an array of objects following the `object` schema.

`Function`: The function holds the encode and decode logic for that key. The data will be encoded by `func(data,true)` and decoded via `func(data,false)`. This is useful for enums or to prevent cases that your binary encoder can't handle. Ex: If your binary encoder can only send integers and strings, that function could convert your float to a string to keep precision.
	
Once the schema is created, you can use it to encode via `schema.encode(obj)` and decode via `schema.decode(encodedObj)`. `schema.decode(schema.encode(obj))` will return an object similar to `obj`.

	
## Full Example
	
	var monsterSchema = new SchemaEncoder({
		hitpoints:null,
		precisionNum:function(data,isEncode){
			if(isEncode)
				return '' + data;
			else //decode		
				return +data;
		},
		position:{
			x:null,
			y:null,
		},
		
	},{	//optional
		isDangerous:null,
		friendList:null,
		size:new SchemaEncoder({
			width:null,
			height:null,
		},{
			offsetX:null,
			offsetY:null,
		}),
		knownAttacks:Array.of({
			id:function(data,isEncode){
				var ATK_ENUM = {"0":"fire","1":"strike","fire":0,"strike":1};
				return ATK_ENUM[data];
			},
			damage:new SchemaEncoder({},{
				fire:null,
				ice:null,
				physical:null,
			})
		}),
	
	});
	
	
This schema can be used to encode object such as:

	var monster = {
		hitpoints:1000,
		precisionNum:1223.12312313,
		position:{
			x:1,
			y:-3534,
		},
		knownAttacks:[{
			id:"fire",
			damage:{
				fire:321,
				physical:321,
			},
		},{
			id:"strike",
			damage:{
				physical:123,
			},
		}],
		size:{
			width:1,
			height:2,
			offsetY:3,
		},
	};
	//[1000,[1,-3534],"1223.12312313",3,[[[5,321,321],0],[[1,123],1]],[2,1,1,3]]

And

	var monster2 = {
		hitpoints:1000,
		precisionNum:1,
		position:{
			x:1,
			y:-3534,
		},
		friendList:{
			"sam":true,
			"bob":false,
		}
	};	
	//[1000,[1,-3534],"1",8,{"sam":true,"bob":false}]

# License

MIT.

