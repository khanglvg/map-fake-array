export default function isNum(value) {
	let rs = true;

	if (
	  value == null ||
	  typeof value === 'boolean' ||
	  typeof value === 'object' ||
	  value === Infinity ||
	  value === -Infinity ||
	  isNaN(value)
	) {
		rs = false;
	}

	return rs;
}