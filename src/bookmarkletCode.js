document.querySelector("html").innerHTML = `
<head>
	<meta charset='utf-8'>
	<meta name='viewport' content='width=device-width,initial-scale=1'>

	<title>Timelogs BETA</title>
</head>

<body>
</body>
`;

function addCSS(filename) {
	var head = document.getElementsByTagName("head")[0];

	var style = document.createElement("link");
	style.href = `${filename}?${new Date().getTime()}`;
	style.type = "text/css";
	style.rel = "stylesheet";
	head.append(style);
}

function addScript(filename) {
	var head = document.getElementsByTagName("head")[0];

	var script = document.createElement("script");
	script.src = `${filename}?${new Date().getTime()}`;
	script.type = "text/javascript";

	head.append(script);
}

addCSS(
	"https://raw.githubusercontent.com/jinnotgin/ufinity-timelog-upgrade/master/public/global.css"
);
addCSS(
	"https://raw.githubusercontent.com/jinnotgin/ufinity-timelog-upgrade/master/public/build/bundle.css"
);
addScript(
	"https://raw.githubusercontent.com/jinnotgin/ufinity-timelog-upgrade/master/public/build/bundle.js"
);
