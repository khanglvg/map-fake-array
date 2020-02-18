import isNum from './utils/isNumber';

export default function UniqId(start = 0) {
	let currentId = isNum(start) ? start : 0;

	function valid(sign) {
		return sign == currentId;
	}

	function current() {
		return currentId;
	}

	function next() {
		currentId++;
		return currentId;
	}
}