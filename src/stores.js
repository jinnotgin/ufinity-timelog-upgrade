import { readable, writable } from "svelte/store";
import moment from "moment";
import _ from "lodash";
import { SelectionGrid } from "./utils.js";

/*** STORES ***/
const calendarView_generator = (date) => {
	return {
		month: date.clone().startOf("month"),
		startDate: date.clone().startOf("month").startOf("week"),
		endDate: date.clone().endOf("month").endOf("week"),
	};
};
export const calendarView = writable(calendarView_generator(moment()));

export const projectsData = writable({});

export const timelogsData = writable({
	server: { fetching: true },
	client: {},
});

export const timelogAutoRules = writable([
	{
		days: [1, 2, 3, 5],
		projectIds: [296],
		hours: 8,
	},
	{
		days: [4],
		projectIds: [296, 831],
		hours: 4,
	},
]);
export const daysWithAutoRule = writable([]);
export const datesSelectedRange = writable([]);
export const datesSelection = readable(new SelectionGrid(60 * 60 * 24));

export const showWeekends = writable(false);
export const uncommittedProjectsPerDay = writable([]);

/*** METHODS (TODO: consider refactoring this to a new location) ***/
export const calendarView_changeMonth = (storeValue, direction) => {
	let month = moment();

	if (moment.isMoment(direction) || moment.isDate(direction)) {
		month = moment(direction).startOf("month");
	} else {
		month = storeValue.month;

		if (direction === "increase") month.add(1, "months");
		else if (direction === "decrease") month.subtract(1, "months");
	}

	calendarView.update((_) => calendarView_generator(month));

	return true;
};
