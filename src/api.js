// not really an API
const URL = "https://time.ufinity.com/timelog-web/timelog.html";

// TODO: environment variables for mode checks
const MODE = "dev";
import { testData } from "./testData.js";
// const MODE = "prod";

import _ from "lodash";
import moment from "moment";

const formParams_textProcessor = (str) => str.replace(/ /g, "+");
const formParams_maker = (params) => {
	return Object.keys(params)
		.map((key) => {
			return (
				formParams_textProcessor(key) +
				"=" +
				formParams_textProcessor(params[key])
			);
		})
		.join("&");
};

const fetcher = async (method = "GET", payload = {}) => {
	let domTree = false;
	try {
		const fetchOptions = { method };
		if (method === "POST") {
			fetchOptions.headers = {
				"Content-Type": "application/x-www-form-urlencoded",
			};
			fetchOptions.body = formParams_maker(payload);
		}
		const response = await fetch(URL, fetchOptions);
		console.log(fetchOptions);
		if (!!!response.ok) throw new Error("Network response was not ok");

		const data = await response.text();
		const parser = new DOMParser();
		domTree = parser.parseFromString(data, "text/html");

		return domTree;
	} catch (error) {
		console.warn(error);
		return error;
	}
};

const wait = async (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const getProjectsData = async () => {
	if (MODE === "dev") return testData.projectsData;
	try {
		const dom = await fetcher();

		const output = {};
		[...dom.querySelectorAll("#projectId option")].map((item) => {
			if (!!item.disabled) return false;

			const id = item.value;
			const name = item.textContent.trim();

			output[id] = { id, name };
		});
		return output;
	} catch (error) {
		console.warn(error);
		return error;
	}
};

export const getTimelogsData = async () => {
	const dateFormat = "DD MMM YYYY";
	if (MODE === "dev") {
		const timelogsData = _.clone(testData.timelogsData);
		Object.keys(timelogsData).map((dateIso) => {
			Object.entries(timelogsData[dateIso]).map(([projectId, txnItem]) => {
				// console.log(projectId);
				const { date = false } = txnItem;
				timelogsData[dateIso][projectId].date = moment(date);
			});
		});
		return timelogsData;
	}
	try {
		const dom = await fetcher();

		const output = {};
		[...dom.querySelectorAll('button[onclick^="editTimelog"]')].map((item) => {
			// TODO: use regex instead
			const [projectId, date, hours, id] = item
				.getAttribute("onclick")
				.replace("editTimelog(", "")
				.replace(")", "")
				.replace(/\'/g, "")
				.split(",");

			const momentDate = moment(date, dateFormat)
				.utc()
				.add(moment().utcOffset(), "minutes");
			const dateISO = momentDate.toISOString();

			if (typeof output[dateISO] === "undefined") output[dateISO] = {};
			if (typeof output[dateISO][projectId] === "undefined")
				output[dateISO][projectId] = {};
			output[dateISO][projectId] = { projectId, date: momentDate, hours, id };
		});

		return output;
	} catch (error) {
		console.warn(error);
	}
};

export const saveTimelog = async (data) => {
	try {
		if (MODE === "dev") {
			await wait(550);
			const chance = Math.random();
			if (chance > 0.1)
				return data.action === "update" ? data.id : `${new Date().getTime()}`;
			else throw "Simulating some error for kicks";
		}

		// console.log(data);
		const { action, projectId, dateIso, hours, id = "" } = data;

		const strings = {
			projectId: `${projectId}`.trim(),
			date: moment(dateIso).format("DD MMM YYYY"),
			hours: `${hours}`.trim(),
			id: `${id}`.trim(),
		};

		let payload = {
			projectId: strings.projectId,
			date: strings.date,
			hour: strings.hours,
			description: "",
		};
		switch (action) {
			case "create": {
				payload.action = "Add";
				break;
			}
			case "update": {
				payload.action = "Overwrite";
				payload.id = strings.id;
				break;
			}
			case "delete": {
				payload.action = "Delete";
				payload.id = strings.id;
				break;
			}
			default: {
			}
		}

		const dom = await fetcher("POST", payload);

		const successElem = dom.querySelector(
			`button[onclick^="editTimelog('${strings.projectId}','${strings.date}','${strings.hours}'"]`
		);

		if (successElem === null)
			throw "Kena blocked when making my mark on history";
		else
			return successElem
				.getAttribute("onclick")
				.split(",")
				.pop()
				.replace(")", "")
				.trim();
	} catch (error) {
		console.warn(error);
		return false;
	}
};
