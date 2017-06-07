#!/usr/bin/env node

var fs       = require('fs');
var Path     = require('path');
var mkpath   = require('yow/fs').mkpath;
var random   = require('yow/random');
var sprintf  = require('yow/sprintf');
var isObject = require('yow/is').isObject;
var isString = require('yow/is').isString;
var logs     = require('yow/logs');
var Queue    = require('yow/queue');
var Matrix   = require('pixel-matrix');




var App = function(argv) {

	var _this    = this;
	var _queue   = new Queue(50);
	var _matrix  = undefined;
	var _io      = undefined;
	var _server  = undefined;
	var _promise = undefined;
	var _noEmit  = false;

	var argv = parseArgs();

	function parseArgs() {

		var args = require('yargs');

		args.usage('Usage: $0 [options]');
		args.help('h').alias('h', 'help');

		args.option('l', {alias:'log',         describe:'Redirect logs to file'});
		args.option('H', {alias:'height',      describe:'Height of RGB matrix', default:32});
		args.option('W', {alias:'width',       describe:'Width of RGB matrix', default:32});
		args.option('p', {alias:'port',        describe:'Listen to specified port', default:3003});
		args.option('n', {alias:'dry-run',     describe:'Do not access hardware, just print'});

		args.wrap(null);

		args.check(function(argv) {
			return true;
		});

		return args.argv;
	}


	function runText(options) {


		return new Promise(function(resolve, reject) {

			options = options || {};

			if (options.fontName)
				options.fontName = sprintf('%s/fonts/%s.ttf', __dirname, options.fontName);

			console.log('runText:', JSON.stringify(options));
			_matrix.runText(options.text, options, resolve);
		});

	}

	function runEmoji(options) {

		return new Promise(function(resolve, reject) {

			options = options || {};

			if (!options.id || options.id < 1 || options.id > 846)
				options.id = 704;

			options.image = sprintf('%s/images/emojis/%d.png', __dirname, options.id);

			console.log('runImage:', JSON.stringify(options));
			_matrix.runImage(options.image, options, resolve);
		});

	}

	function runAnimation(options) {

		return new Promise(function(resolve, reject) {

			options = options || {};

			options.fileName = options.name;

			// Generate a random one if not specified
			if (options.fileName == undefined) {
				var files = fs.readdirSync(sprintf('%s/animations', __dirname));
				options.fileName = random(files);
			}
			else {
				options.fileName = sprintf('%s.gif', options.fileName);
			}

			// Add path
			options.fileName = sprintf('%s/animations/%s', __dirname, options.fileName);

			console.log('runImage:', JSON.stringify(options));
			_matrix.runAnimation(options.fileName, options, resolve);
		});

	}

	function runRain(options) {

		return new Promise(function(resolve, reject) {

			options = options || {};

			console.log('runRain:', JSON.stringify(options));
			_matrix.runRain(options, resolve);
		});

	}

	function runPerlin(options) {

		return new Promise(function(resolve, reject) {

			options = options || {};

			console.log('runPerlin:', JSON.stringify(options));
			_matrix.runPerlin(options, resolve);
		});

	}

	function enqueue(promise, options) {

		if (options == undefined)
			options = {};

		if (options.priority == 'low' && _matrix.isRunning())
			return;

		function enqueue() {
			if (options.priority == '!') {
				_queue.queue([promise]);
				_matrix.stop();
			}
			else if (options.priority == 'high') {
				_queue.prequeue(promise);
			}
			else {
				_queue.enqueue(promise);
			}
		}

		function dequeue() {
			_queue.dequeue().then(function() {
				_io.emit('idle');

			})
			.catch(function(error) {
				console.log(error.stack);
				_io.emit('idle');
			});

		}

		if (_queue.isEmpty()) {
			enqueue();
			dequeue();
		}
		else {
			enqueue();
		}

	}


	function displayIP() {

		return new Promise(function(resolve, reject) {
			function getIP(name) {

				try {
					var os = require('os');
					var ifaces = os.networkInterfaces();

					var iface = ifaces[name];

					for (var i = 0; i < iface.length; i++)
						if (iface[i].family == 'IPv4')
							return iface[i].address;

				}
				catch(error) {
					return undefined;

				}
			}

			var ip = getIP('wlan0');

			if (ip == undefined)
				ip = 'Ready';

			_matrix.runText(ip, {}, resolve);
		});

	}

	function runDry() {
		var io = require('socket.io-client');
		var socket = io(sprintf('http://localhost:%d/pixel-matrix', argv.port));


		socket.on('connect', function() {
			console.log('Connected.');

			socket.emit(random(['text', 'animation', 'rain', 'perlin', 'emoji']));

			socket.on('idle', function() {
				var count = random(1, 4);

				for (var i = 0; i < count; i++)
					socket.emit(random(['text', 'animation', 'rain', 'perlin', 'emoji']));
			});

		});

		socket.on('disconnect', function() {
			console.log('Disconnected.');
		});


	};

	function run() {

		logs.prefix();

		if (argv.log) {
			var parts = Path.parse(__filename);
			var logFile = Path.join(parts.dir, parts.name + '.log');

			logs.redirect(logFile);
		}

		_matrix = new Matrix(argv.dryRun ? {hardware:'none'} : {width:argv.width, height:argv.height});
		_server = require('http').createServer(function(){});
		_io     = require('socket.io')(_server).of('/pixel-matrix');


		displayIP().then(function() {

			console.log('Started', new Date());

			_server.listen(argv.port, function() {
				console.log('Listening on port', argv.port, '...');
			});

			_io.on('connection', function(socket) {

				console.log('Connection from', socket.id);

				socket.on('disconnect', function() {
					console.log('Disconnected from', socket.id);
				});

				socket.on('cancel', function() {
					_queue.clear();
					_matrix.stop();
				});

				socket.on('stop', function() {
					_queue.clear();
					_matrix.stop();
				});

				socket.on('text', function(options) {
					enqueue(runText.bind(_this, options), options);
				});

				socket.on('animation', function(options) {
					enqueue(runAnimation.bind(_this, options), options);
				});

				socket.on('emoji', function(options) {
					enqueue(runEmoji.bind(_this, options), options);
				});

				socket.on('rain', function(options) {
					enqueue(runRain.bind(_this, options), options);
				});

				socket.on('perlin', function(options) {
					enqueue(runPerlin.bind(_this, options), options);
				});

				socket.on('hello', function(data) {
					console.log('hello');
				})

			});

			if (argv.dryRun)
				runDry();



		});


	}

	run();

};

new App();