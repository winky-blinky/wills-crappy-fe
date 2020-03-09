const w = 20;
const nx = 10;
const ny = 10;
const SAT = 0.99;
const VAL = 0.99;

var winky_blinky;

var hue = 0.2;
var color = hsvToColor(hue, SAT, VAL);

function light(s) {
	return Math.floor(s/w);
}

function xToHue(x) {
	return Math.min(Math.max((x-250)/250, 0), 1);
}

function drawLight(context, x, y, color) {
	lx = light(x);
	ly = light(y);
	if( isInCanvas(lx, ly) ) {
		context.fillStyle = color;
 		context.fillRect(lx*w, ly*w, w, w);
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
				context.fillStyle = paletteColor(x, y);
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

function paletteColor(x, y) {
	return hsvToColor(hue, (x-250)/500, y/400);
}

document.addEventListener("DOMContentLoaded", function() {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var width = window.innerWidth;
	var height = window.innerHeight;
	var drawing = false;
	var lastX, lastY;

	console.log(color)
	canvas.width = width;
	canvas.height = height;

	drawPalette(canvas, 0.75);
	drawHues(canvas);

	const request = new XMLHttpRequest();
	request.open("GET", "http://localhost:3000/boards");
	request.send();
	request.onload = () => {
		if(request.status === 200) {
			console.log(request.response);
			winky_blinky = JSON.parse(request.response);
		}
	}

	canvas.onmousedown = function(e) {
		const x = e.clientX;
		const y = e.clientY;
		if( isInCanvas(x, y) ) {
			drawing = true;
			lastX = x;
			lastY = y;
		}
	}

	canvas.onmousemove = function(e) {
		const x = e.clientX;
		const y = e.clientY;
		if( drawing ) {
			drawLight(context, lastX, lastY, 'white');
			drawLight(context, x, y, color);
			lastX = x;
			lastY = y;
		}
	}

	canvas.onmouseup = function(e) {
		const x = e.clientX;
		const y = e.clientY;
		if(isInPalette(x, y)) {
			color = paletteColor(x, y);
		}

		drawing = false;

		const light = winky_blinky.board.find(e => {
			if(Math.abs(e.x-x) <= 5 && Math.abs(e.y-y) <= 5)
				return e;
		});
		console.log("light: " + JSON.stringify(light));
		if( light ) {
			light.color = color;
			drawLight(context, light.x, light.y, color);
			const request = new XMLHttpRequest();
			request.open("PUT", `http://localhost:3000/pixel/${light.id}`);
			request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			request.send(JSON.stringify(light));
			request.onload = () => {
				if(request.status === 200) {
					console.log("lights set complete successfully");
				}
			}
		}
		if( isInPalette(x, y) ) {
			color = paletteColor(x, y);
			console.log("color: " + color);
		}
		if( isInHue(x,y) ) {
			hue = xToHue(x);
			drawPalette(canvas, hue);
			drawHues(canvas);
			console.log("hue: " + hue.toString())
		}
	}
});
