const w = 10;
const nx = 10;
const ny = 10;
const SAT = 0.99;
const VAL = 0.99;
var HOST

var winky_blinky;

var hue = 0.2;
var color = hsvToColor(hue, SAT, VAL);

function light(s) {
	return Math.floor(s/w);
}

function xToHue(x) {
	return Math.min(Math.max((x-250)/250, 0), 1);
}

function findLight(x, y) {
	return winky_blinky.board.find(e => {
		if(Math.abs(e.x-x) <= 5 && Math.abs(e.y-y) <= 5) {
			return e;
		}
	});
}

function drawLight(context, light, color) {
	lx = light.x;
	ly = light.y;
	if( isInCanvas(lx, ly) ) {
		context.fillStyle = color;
 		context.fillRect(lx-5, ly-5, w, w);
		context.stroke();
	}
}

function hsvToColor(h, s, v) {
    h=h%1;
    s=s%1;
    v=v%1;

    var r, g, b;
    var b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    const rgb = {r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255)};
		var c = Math.floor(rgb.r*256*256 + rgb.g*256 + rgb.b).toString(16);
		if( c.length%2 == 1 ) {
			c = "0" + c;
		}
		return "#" + c;
}

function drawPalette(canvas) {
	const context = canvas.getContext('2d');
	for(x=0; x<canvas.width; ++x) {
		for(y=0; y<canvas.height; ++y) {
			if(isInPalette(x, y)) {
				context.fillStyle = calcPaletteColor(x, y);
		 		context.fillRect(x, y, 1, 1);
				context.stroke();
			}
		}
	}
}

function drawHues(canvas) {
	const context = canvas.getContext('2d');
	for(x=0; x<canvas.width; ++x) {
		for(y=0; y<canvas.height; ++y) {
			if( isInHue(x, y) ) {
				const c = hsvToColor(xToHue(x), SAT, VAL);
				context.fillStyle = c;
		 		context.fillRect(x, y, 1, 1);
				context.stroke();
			}
		}
	}
}

function isInCanvas(x, y) {
	return light(x) < nx && light(y) < ny;
}

function isInPalette(x, y) {
	return light(x) > nx && light(y) > 0;
}

function isInHue(x, y) {
	return light(y) == 0 && light(x) > nx;
}

function paletteColor(context, x, y) {
	const c = context.getImageData(x, y, 1, 1).data;
	console.log(c);
	var color = "#";
	color += (c[0] < 16 ? "0" : "") + c[0].toString(16);
	color += (c[1] < 16 ? "0" : "") + c[1].toString(16);
	color += (c[2] < 16 ? "0" : "") + c[2].toString(16);
	return color;
}

function calcPaletteColor(x, y) {
	return hsvToColor(hue, (x-250)/500, y/400);
}

function drawBoard(context, winky_blinky) {
	winky_blinky.board.forEach(light => {
		context.beginPath();
		context.rect(light.x-5, light.y-5, 10, 10);
		context.strokeStyle = "gray";
		context.lineWidth = 1;
		context.stroke();
	});
}

function updateHardware(context, light, color) {
	if(light) {
		light.color = color;
		const request = new XMLHttpRequest();
		request.open("PUT", `http://${HOST}/lights/${light.lightId}`);
		request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		request.onload = () => {
			if(request.status !== 200) {
				console.log("updateHardware failed");
			}
		}
		request.send(JSON.stringify({...light, id: light.lightId}));
	}
}

document.addEventListener("DOMContentLoaded", function() {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var width = window.innerWidth;
	var height = window.innerHeight;
	var drawing = false;
	var lastX, lastY;


	HOST = window.location.host
	console.log(`Host is: ${HOST}`);

	console.log(color)
	canvas.width = width;
	canvas.height = height;

	drawPalette(canvas, 0.75);
	drawHues(canvas);

	const request = new XMLHttpRequest();
	request.open("GET", `http://${HOST}/winky_blinkies/f5104b2`);
	request.send();
	request.onload = () => {
		if(request.status === 200) {
			console.log(request.response);
			winky_blinky = JSON.parse(request.response);
			drawBoard(context, winky_blinky);
		}
	}

	canvas.onmousedown = function(e) {
		const x = e.clientX;
		const y = e.clientY;
		if( isInCanvas(x, y) ) {
			drawing = true;
			const light = findLight(x, y);
			updateHardware(context, light, color);
			drawLight(context, light, color);
		}
		lastX = x;
		lastY = y;
	}

	canvas.onmousemove = function(e) {
		const x = e.clientX;
		const y = e.clientY;
		if( drawing ) {

			if( isInCanvas(x, y) ) {
				const lastLight = findLight(lastX, lastY);
				const thisLight = findLight(x, y);
				if(lastLight.lightId !== thisLight.lightId) {
					updateHardware(context, thisLight, color);
					drawLight(context, thisLight, color);
				}

				lastX = x;
				lastY = y;
			}
		}
		// INSERT: for tracking hues to the light color.
		if(isInHue(x, y)) {
			if(Math.abs(lastX - x) > 10) {
				updateHardware(context, {lightId: 'c381f5c6-fa1e-4c76-9d91-10d175e92eb6'}, hsvToColor(xToHue(x), SAT, VAL));
				lastX = x;
			}
		}
	}

	canvas.onmouseup = function(e) {
		const x = e.clientX;
		const y = e.clientY;

		drawing = false;

		const light = findLight(x, y);
		console.log("light: " + JSON.stringify(light));

		if( isInPalette(x, y) ) {
			color = paletteColor(context, x, y);
			console.log("color: " + color);
		}
		if( isInHue(x,y) ) {
			const light = findLight(10, y);
			hue = xToHue(x);
			drawPalette(canvas, hue);
			drawHues(canvas);
			console.log("hue: " + hue.toString())
		}
	}
});
