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

export class SelectionGrid {
	constructor(step = 1, offset = 0) {
		this.step = step;
		this.offset = offset;
		this.selection = {};
	}

	_helper(inputSlot, slotDoesNotExist = false) {
		const slot = Math.floor(inputSlot / this.step - this.offset); //normalised slot

		const anchors = Object.keys(this.selection);

		const lAnchorIndex = _.sortedIndex(anchors, slot) - +slotDoesNotExist; // leftNearest anchor's index
		const lAnchor = parseFloat(anchors[lAnchorIndex]); // leftNearast anchor
		const lAnchorExtension = this.selection[lAnchor]; // leftNearast anchor
		const lAnchorExtended = lAnchor + lAnchorExtension;

		const output = {
			slot,
			anchors,
			lAnchorIndex,
			lAnchor,
			lAnchorExtension,
			lAnchorExtended,
		};
		return output;
	}

	exists(inputSlot) {
		// 0 = does not exist
		// 1 = exist, is an anchor
		// 2 = exist, is not an anchor
		const helperData = this._helper(inputSlot);
		const { slot, anchors } = helperData;

		if (anchors.includes(`${slot}`)) return 1;
		else {
			const { lAnchor, lAnchorExtended } = helperData;

			return slot >= lAnchor && slot <= lAnchorExtended ? 2 : 0;
		}
	}

	_add(inputSlot, extendToAnchors = false) {
		const helperData = this._helper(inputSlot, true);
		const { slot, anchors } = helperData;

		if (anchors.length === 0 || !!!extendToAnchors) {
			this.selection[slot] = 0;
		} else {
			const { lAnchorIndex, lAnchor } = helperData;

			const rAnchorIndex = lAnchorIndex + 1;
			const check_rAnchorExists = rAnchorIndex < anchors.length; //check if rightNearest anchor exists
			const rAnchor = check_rAnchorExists
				? parseFloat(anchors[rAnchorIndex])
				: false; // rightNearast anchor

			const check_slotBesideAnchor = slot === lAnchor + 1;
			if (check_slotBesideAnchor) {
				// no connection is required
				this.selection[slot] = 0;
			} else {
				const check_rAnchorIsNearer =
					!!rAnchor && rAnchor - slot < slot - lAnchor; // check if rAnchor is nearer (if it exists)

				if (check_rAnchorIsNearer) {
					// if nearestAnchor is Right
					this.selection[slot] = rAnchor - slot - 1; // slot will become new Anchor that will extend to just before rAnchor
				} else {
					// if nearestAnchor is Left
					this.selection[lAnchor] = slot - 1 - lAnchor; // extend the lAnchor to extend just before slot
					this.selection[slot] = 0; // slot will become new Anchor
				}
			}
		}
		return this.selection;
	}

	add(inputSlot, extendToAnchors = false) {
		if (!!this.exists(inputSlot)) return false;

		this._add(inputSlot, extendToAnchors);
	}

	_remove(inputSlot) {
		const { slot, lAnchor, lAnchorExtension, lAnchorExtended } = this._helper(
			inputSlot
		);

		if (lAnchor === slot && lAnchorExtension === 0) {
			delete this.selection[lAnchor];
		} else {
			this.selection[lAnchor] = slot - 1 - lAnchor - 1;
			this.selection[slot - 1] = 0;
			if (lAnchorExtended !== slot)
				this.selection[slot + 1] = lAnchorExtended - (slot + 1);
		}
		return this.selection;
	}

	remove(inputSlot) {
		if (!!!this.exists(inputSlot)) return false;

		return this._remove(inputSlot);
	}

	toggle(inputSlot) {
		if (!!this.exists(inputSlot)) return this._remove(inputSlot);
		else return this._add(inputSlot);
	}

	reindex() {
		const anchors = Object.keys(this.selection);
		const future_selection = _.cloneDeep(this.selection);

		// set first item
		const firstAnchor_str = anchors[0];
		future_selection[firstAnchor_str] = this.selection[firstAnchor_str];

		let previousAnchor_str = firstAnchor_str;
		let previousAnchor = parseFloat(previousAnchor_str);
		let isConnecting = false;
		for (let i = 1; i < anchors.length; i++) {
			let previousAnchorExtended =
				previousAnchor + future_selection[previousAnchor];

			const currentAnchor_str = anchors[i];
			const currentAnchor = parseFloat(currentAnchor_str);

			if (i === anchors.length - 1) {
				future_selection[currentAnchor_str] = this.selection[currentAnchor_str];
			} else if (currentAnchor === previousAnchorExtended + 1) {
				isConnecting = true;
				future_selection[previousAnchor_str] += this.selection[currentAnchor];
				delete future_selection[currentAnchor_str];

				if (i < anchors.length - 1) future_selection[previousAnchor_str] += 1;
			} else {
				if (isConnecting) {
					future_selection[previousAnchor_str] -= 1;
					future_selection[previousAnchorExtended] = 0;
				}
				future_selection[currentAnchor_str] = this.selection[currentAnchor_str];

				previousAnchor_str = currentAnchor_str;
				previousAnchor = parseFloat(previousAnchor_str);
			}
		}

		this.selection = future_selection;
		return this.selection;
	}

	reset() {
		this.selection = {};
	}

	toArray(originalInput = false) {
		const transformStepToInput = (slot) => (slot + this.offset) * this.step;

		const output = [];
		for (let [anchor, extension] of Object.entries(this.selection)) {
			const anchorValue = parseFloat(anchor);
			for (let i = 0; i <= extension; i++) {
				if (originalInput) output.push(transformStepToInput(anchorValue + i));
				else output.push(anchorValue + i);
			}
		}

		return output;
	}
}
