import moment from "moment";
import _ from "lodash";

export const timelogAutoRules_getRule = (storeValue, date) => {
	const day = moment(date).day();
	let output = [];
	for (let i = 0; i < storeValue.length; i++) {
		const rule = storeValue[i];
		const { days, projectIds, hours } = rule;

		if (days.includes(day)) {
			output = projectIds.map((projectId) => {
				return {
					projectId,
					hours,
				};
			});
			break;
		}
	}
	return output;
};

export const timelog_saving = (store, storeValue, params, newId) => {
	const { dateIso, projectId, action } = params;

	const future_storeValue = _.clone(storeValue);
	const transactionData = future_storeValue.client.data[dateIso][projectId];

	if (action === "saving") {
		transactionData.fetching = true;
	} else if (action === "saveFailure") {
		delete transactionData.fetching;
	} else if (action === "saveSuccess") {
		delete transactionData.fetching;
		transactionData.id = newId;

		const serverData = future_storeValue.server.data;
		if (typeof serverData[dateIso] === "undefined") serverData[dateIso] = {};
		if (typeof serverData[dateIso][projectId] === "undefined")
			serverData[dateIso][projectId] = {};

		serverData[dateIso][projectId] = _.cloneDeep(transactionData);
	}
	store.update((_) => future_storeValue);
};
